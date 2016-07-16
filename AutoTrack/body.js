//Author: blackmius
/*
	AutoTrack - автоматически выбирает цель для трека с приоритетом хп*естьинвиз
	kamikadze - кидать трэк из инвиза в какой жопе вы бы не находились
*/
//интервал(в секундах) через который будет делаться проверка
var interval = 0.1

var LenseBonusRange = 200

var invisibilityImportance = 0.2

var kamikadze = false

var invisibilityAbils = [
	'clinkz_wind_walk',
	'invoker_ghost_walk',
	'nyx_assassin_vendetta',
	'riki_permanent_invisibility',
	'slark_shadow_dance',
	'templar_assassin_meld',
	'treant_natures_guise',
	'weaver_shukuchi',
	'sandking_sand_storm'
]

var invisibilityItems = [	
	'item_glimmer_cape',
	'item_shadow_amulet',
	'item_invis_sword',
	'item_silver_edge'	
] 

try{
	Game.Panels.AutoTrack.DeleteAsync(0)
}catch(e){}

function hasInvisibility(ent) {
	//проверка на айтемы
	for (var i in invisibilityItems) {
		var hasItem = Entities.HasItemInInventory(ent, invisibilityItems[i])
		if (hasItem) return 1-invisibilityImportance
	}

	var abilitiesCount = Entities.GetAbilityCount(ent)
	for (var i=0; i<abilitiesCount; i++) {
		var ability = Entities.GetAbility(ent, i)
		var abilityName = Abilities.GetAbilityName(ability)
		if (invisibilityAbils.some(function(i) {return i == abilityName})) return 1-invisibilityImportance
	}
	
	return 1
}

function AutoTrackFunc(){
	var MyEnt = parseInt( Players.GetPlayerHeroEntityIndex(Game.GetLocalPlayerID()) )

	//не кидать трек если бх в инвизе
	if(!kamikadze && Entities.IsInvisible(MyEnt)) return
	
	//информация о трэке
	var Ulti = Entities.GetAbilityByName(MyEnt, 'bounty_hunter_track' )
	var UltiRange = Abilities.GetCastRange( Ulti )
	if(Entities.HasItemInInventory( MyEnt, 'item_aether_lens'))
		UltiRange+=LenseBonusRange
	var UltiLvl = Abilities.GetLevel(Ulti)
	var UltiCd = Abilities.GetCooldownTimeRemaining( Ulti )

	//проверка на готовность трэка
	if(UltiLvl==0 || UltiCd > 0) return		

	var enemiesNeedenTrack = []

	//поиск ближайших врагов
	var HEnts = Game.PlayersHeroEnts()
	for (i in HEnts) {
		var ent = parseInt(HEnts[i])
		if( !Entities.IsEnemy(ent) || Entities.IsMagicImmune(ent) || !Entities.IsAlive(ent) || Entities.IsInvisible(ent)) continue
			
		var Range = Entities.GetRangeToUnit(MyEnt, ent)
		if(Range>UltiRange) continue

		//весит ли на враге трэк
		var buffs = Game.GetBuffsNames(ent)
		var hasTrack = buffs.some(function(i) {return i == 'modifier_bounty_hunter_track'})
		if (hasTrack) continue

		enemiesNeedenTrack.push(ent)
	}

	//врагов нет
	if (enemiesNeedenTrack.length == 0) return

	//отсортируем врагов по хп, наличию инвиза и растоянию
	enemiesNeedenTrack.sort(function(enemy) {
		var HP = Entities.GetHealth(enemy)
		var invis = hasInvisibility(enemy)
		return HP*invis
	})

	//выбираем героя
	var lowHPEnemy = enemiesNeedenTrack[0]

	//кидаем трэк
	GameUI.SelectUnit(MyEnt,false)
	Game.CastTarget(MyEnt, Ulti, lowHPEnemy, false)
}


var AutoTrackUI = function(){
	Game.GetFile('AutoTrack/panel.xml', function(a){
		Game.Panels.AutoTrack = $.CreatePanel( 'Panel', Game.GetMainHUD(), 'AutoTrack1' )
		Game.Panels.AutoTrack.BLoadLayoutFromString( a, false, false )
	
		GameUI.MovePanel(Game.Panels.AutoTrack,function(p){
			var position = p.style.position.split(' ')
			Config.MainPanel.x = position[0]
			Config.MainPanel.y = position[1]
			Game.SaveConfig('AutoTrack/config.conf', Config)
		})
		Game.GetConfig('AutoTrack/config.conf',function(a){
			Config = a
			Game.Panels.AutoTrack.style.position = Config.MainPanel.x + ' ' + Config.MainPanel.y + ' 0'
		});
		var slider = []
		Game.Panels.AutoTrack.Children()[0].min = 0.0
		Game.Panels.AutoTrack.Children()[0].max = 1.0
		Game.Panels.AutoTrack.Children()[0].value = invisibilityImportance
		Game.Panels.AutoTrack.Children()[0].lastval = Game.Panels.AutoTrack.Children()[0].value
		function x(){ $.Schedule( 0.1,function(){
			if(Game.Panels.AutoTrack.Children()[0].value!=Game.Panels.AutoTrack.Children()[0].lastval){
				invisibilityImportance=Game.Panels.AutoTrack.Children()[0].value
				Game.Panels.AutoTrack.Children()[0].lastval=Game.Panels.AutoTrack.Children()[0].value
			}
			Game.Panels.AutoTrack.Children()[1].Children()[1].text = invisibilityImportance.toFixed(2)
			kamikadze = Game.Panels.AutoTrack.Children()[2].Children()[0].checked
			if(AutoTrack.checked)
				x() 
			}
		)}
		x()
	})
}

var AutoTrackOnCheckBoxClick = function(){
	if ( !AutoTrack.checked ){
		Game.Panels.AutoTrack.DeleteAsync(0)
		Game.ScriptLogMsg('Script disabled: AutoTrack', '#ff0000')
		return
	}
	if ( Players.GetPlayerSelectedHero(Game.GetLocalPlayerID()) != 'npc_dota_hero_bounty_hunter' ){
		AutoTrack.checked = false
		Game.ScriptLogMsg('AutoTrack: Not Bounty Hunter', '#ff0000')
		return
	}

	//рисуеи гуи
	AutoTrackUI()

	//циклически замкнутый таймер с проверкой условия с интервалом 'interval'
	function maincheck(){ $.Schedule( interval,function(){
		AutoTrackFunc()
		if(AutoTrack.checked)
			maincheck()
	})}
	maincheck()
	Game.ScriptLogMsg('Script enabled: AutoTrack', '#00ff00')
}

//шаблонное добавление чекбокса в панель
var Temp = $.CreatePanel( "Panel", $('#scripts'), "AutoTrack" )
Temp.SetPanelEvent( 'onactivate', AutoTrackOnCheckBoxClick )
Temp.BLoadLayoutFromString( '<root><styles><include src="s2r://panorama/styles/dotastyles.vcss_c" /><include src="s2r://panorama/styles/magadan.vcss_c" /></styles><Panel><ToggleButton class="CheckBox" id="AutoTrack" text="AutoTrack"/></Panel></root>', false, false)  
var AutoTrack = $.GetContextPanel().FindChildTraverse( 'AutoTrack' ).Children()[0]