//Author: blackmius
/*
	reaverbeaver - авто ульт некра
*/
//интервал(в секундах) через который будет делаться проверка
var interval = 0.1

var LenseBonusRange = 200

var damage = [0.6, 0.75, 0.9]
var aganimdamage = [0.6, 0.9, 1.2]

function reaverbeaverFunc(){
	var MyEnt = parseInt( Players.GetPlayerHeroEntityIndex(Game.GetLocalPlayerID()) )
	
	//информация о ульте
	var Ulti = Entities.GetAbilityByName(MyEnt, 'necrolyte_reapers_scythe' )
	var UltiRange = Abilities.GetCastRange( Ulti )
	if(Entities.HasItemInInventory( MyEnt, 'item_aether_lens'))
		UltiRange+=LenseBonusRange
	var UltiLvl = Abilities.GetLevel(Ulti)
	var UltiCd = Abilities.GetCooldownTimeRemaining( Ulti )
	var UltiDmg = Abilities.GetAbilityDamage(Ulti)
	var UltiManaCost = Abilities.GetManaCost(Ulti)
	var dmg = damage[UltiLvl]
	if(Entities.HasItemInInventory( MyEnt, 'item_ultimate_scepter')) dmg = aganimdamage[UltiLvl]

	//проверка на готовность ульты
	if(UltiLvl==0 || UltiCd > 0 || UltiManaCost > Entities.GetMana(MyEnt)) return		

	var HEnts = Game.PlayersHeroEnts()
	for (i in HEnts) {
		var ent = parseInt(HEnts[i])
		if(Entities.HasItemInInventory(ent, 'item_sphere')) {
			var sphere = Game.GetAbilityByName(ent, 'item_sphere')

			if (Abilities.GetCooldownTimeRemaining(sphere)-2 <= 0) continue
		}
		if( !Entities.IsEnemy(ent) || Entities.IsMagicImmune(ent) || !Entities.IsAlive(ent) || Entities.IsInvisible(ent)) continue
			
		var Range = Entities.GetRangeToUnit(MyEnt, ent)
		if(Range>UltiRange || Range<200) continue

		var enemyhp = Entities.GetHealth(ent)
		var enemymaxhp = Entities.GetMaxHealth(ent)
		var MagicResist = Entities.GetArmorReductionForDamageType( ent, 2 )*100

		var calcdamge = (enemymaxhp-enemyhp)*dmg

		var clearDamage = calcdamge - calcdamge/100*MagicResist

		if (enemyhp > clearDamage) continue
			
		GameUI.SelectUnit(MyEnt,false)
		Game.CastTarget(MyEnt, Ulti, ent, false)
	}	
}

var reaverbeaverOnCheckBoxClick = function(){
	if ( !reaverbeaver.checked ){
		Game.Panels.reaverbeaver.DeleteAsync(0)
		Game.ScriptLogMsg('Script disabled: reaverbeaver', '#ff0000')
		return
	}
	if ( Players.GetPlayerSelectedHero(Game.GetLocalPlayerID()) != 'npc_dota_hero_necrolyte' ){
		reaverbeaver.checked = false
		Game.ScriptLogMsg('reaverbeaver: necr', '#ff0000')
		return
	}

	//циклически замкнутый таймер с проверкой условия с интервалом 'interval'
	function maincheck(){ $.Schedule( interval,function(){
		reaverbeaverFunc()
		if(reaverbeaver.checked)
			maincheck()
	})}
	maincheck()
	Game.ScriptLogMsg('Script enabled: reaverbeaver', '#00ff00')
}

//шаблонное добавление чекбокса в панель
var Temp = $.CreatePanel( "Panel", $('#scripts'), "reaverbeaver" )
Temp.SetPanelEvent( 'onactivate', reaverbeaverOnCheckBoxClick )
Temp.BLoadLayoutFromString( '<root><styles><include src="s2r://panorama/styles/dotastyles.vcss_c" /><include src="s2r://panorama/styles/magadan.vcss_c" /></styles><Panel><ToggleButton class="CheckBox" id="reaverbeaver" text="reaverbeaver"/></Panel></root>', false, false)  
var reaverbeaver = $.GetContextPanel().FindChildTraverse( 'reaverbeaver' ).Children()[0]
