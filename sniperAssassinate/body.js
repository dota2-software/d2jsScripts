//Author: blackmius
/*
	sniperAssassinate - авто ульт снайпера
*/
//интервал(в секундах) через который будет делаться проверка
var interval = 0.1

var LenseBonusRange = 200

function sniperAssassinateFunc(){
	var MyEnt = parseInt( Players.GetPlayerHeroEntityIndex(Game.GetLocalPlayerID()) )
	
	//информация о ульте
	var Ulti = Entities.GetAbilityByName(MyEnt, 'sniper_assassinate' )
	var UltiRange = Abilities.GetCastRange( Ulti )
	if(Entities.HasItemInInventory( MyEnt, 'item_aether_lens'))
		UltiRange+=LenseBonusRange
	var UltiLvl = Abilities.GetLevel(Ulti)
	var UltiCd = Abilities.GetCooldownTimeRemaining( Ulti )
	var UltiDmg = Abilities.GetAbilityDamage(Ulti)
	var UltiManaCost = Abilities.GetManaCost(Ulti)

	//проверка на готовность ульты
	if(UltiLvl==0 || UltiCd > 0 || UltiManaCost > Entities.getMana(MyEnt)) return		

	var HEnts = Game.PlayersHeroEnts()
	for (i in HEnts) {
		var ent = parseInt(HEnts[i])
		if(Entities.HasItemInInventory(ent, 'item_sphere')) {
			var sphere = Game.GetAbilityByName(ent, 'item_sphere')

			if (Abilities.GetCooldownTimeRemaining(sphere)-2 <= 0) continue
		}
		if( !Entities.IsEnemy(ent) || Entities.IsMagicImmune(ent) || !Entities.IsAlive(ent) || Entities.IsInvisible(ent)) continue
			
		var Range = Entities.GetRangeToUnit(MyEnt, ent)
		if(Range>UltiRange) continue

		var enemyhp = Entities.GetHealth(ent)
		var MagicResist = Entities.GetArmorReductionForDamageType( ent, 2 )*100

		var clearDamage = UltiDmg - UltiDmg/100*MagicResist

		if (enemyhp > clearDamage) continue
			
		GameUI.SelectUnit(MyEnt,false)
		Game.CastTarget(MyEnt, Ulti, ent, false)
	}	
}

var sniperAssassinateOnCheckBoxClick = function(){
	if ( !sniperAssassinate.checked ){
		Game.Panels.sniperAssassinate.DeleteAsync(0)
		Game.ScriptLogMsg('Script disabled: sniperAssassinate', '#ff0000')
		return
	}
	if ( Players.GetPlayerSelectedHero(Game.GetLocalPlayerID()) != 'npc_dota_hero_sniper' ){
		sniperAssassinate.checked = false
		Game.ScriptLogMsg('sniperAssassinate: Not Sniper', '#ff0000')
		return
	}

	//циклически замкнутый таймер с проверкой условия с интервалом 'interval'
	function maincheck(){ $.Schedule( interval,function(){
		sniperAssassinateFunc()
		if(sniperAssassinate.checked)
			maincheck()
	})}
	maincheck()
	Game.ScriptLogMsg('Script enabled: sniperAssassinate', '#00ff00')
}

//шаблонное добавление чекбокса в панель
var Temp = $.CreatePanel( "Panel", $('#scripts'), "sniperAssassinate" )
Temp.SetPanelEvent( 'onactivate', sniperAssassinateOnCheckBoxClick )
Temp.BLoadLayoutFromString( '<root><styles><include src="s2r://panorama/styles/dotastyles.vcss_c" /><include src="s2r://panorama/styles/magadan.vcss_c" /></styles><Panel><ToggleButton class="CheckBox" id="sniperAssassinate" text="sniperAssassinate"/></Panel></root>', false, false)  
var sniperAssassinate = $.GetContextPanel().FindChildTraverse( 'sniperAssassinate' ).Children()[0]