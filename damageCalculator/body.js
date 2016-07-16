//Author: blackmius
/*
	DamageCalculator - для каждого вражеского героя пишет, наносимый ему урон, DPS, сможет ли его убить, за сколько секунд
*/
//интервал(в секундах) через который будет делаться проверка
var interval = 0.1

var LenseBonusRange = 200

var invisibilityImportance = 0.2

function ObjectToArray(obj) {
	var x = []
	for (var i in obj) x.push(obj[i])
	return x
}

try{
	Game.Panels.DamageCalculator.DeleteAsync(0)
}catch(e){}

var calculVars = {}

function entCombatInfo(ent) {
	var info = {
		IsAttackImmune: Entities.IsAttackImmune(ent),
		CombatClassAttack: Entities.GetCombatClassAttack(ent),
		CombatClassDefend: Entities.GetCombatClassDefend(ent),
		DamageBonus: Entities.GetDamageBonus(ent),
		DamageMax: Entities.GetDamageMax(ent),
		DamageMin: 	Entities.GetDamageMin(ent),
		Health: Entities.GetHealth(ent),
		AttackSpeed: Entities.GetAttackSpeed(ent),
		AttacksPerSecond: Entities.GetAttacksPerSecond(ent),
		BonusPhysicalArmor: Entities.GetBonusPhysicalArmor(ent),
		Mana: Entities.GetMana(ent),
		MagicalArmorValue: Entities.GetMagicalArmorValue(ent),
		PhysicalArmorValue: Entities.GetPhysicalArmorValue(ent),
		SecondsPerAttack: Entities.GetSecondsPerAttack(ent),
		ArmorReductionForMagicalDamage: Entities.GetArmorReductionForDamageType(ent, DAMAGE_TYPES.DAMAGE_TYPE_MAGICAL),
		ArmorReductionForPhysicalDamage: Entities.GetArmorReductionForDamageType(ent, DAMAGE_TYPES.DAMAGE_TYPE_PHYSICAL)
	}

	info.Damage = (info.DamageMax-info.DamageMin)/2 + info.DamageMin + info.DamageBonus
	info.Armor = info.PhysicalArmorValue+info.BonusPhysicalArmor

	return info
}

function DamageCalculatorFunc(){
	var MyEnt = parseInt( Players.GetPlayerHeroEntityIndex(Game.GetLocalPlayerID()))
	var myStats = entCombatInfo(MyEnt)

	var ents = Game.PlayersEnemyHeroEnts()

	for(m in ents){
		var Ent = ents[m]
		var heroname = Entities.GetUnitName(Ent)
		var enemyStats = entCombatInfo(Ent) 
		var finalDamage = Math.round(myStats.Damage*(1-(0.06*enemyStats.Armor)/(1+0.06*enemyStats.Armor)))
		var enemyFinalDamage = Math.round(enemyStats.Damage*(1-(0.06*myStats.Armor)/(1+0.06*myStats.Armor)))
		
		var Attacks4kill = Math.round(enemyStats.Health/finalDamage)
		var enemyAttacks4kill = Math.round(myStats.Health/enemyFinalDamage)

		var time4Win = Math.floor(Attacks4kill/myStats.AttacksPerSecond)
		var enemyTime4Win = Math.floor(enemyAttacks4kill/enemyStats.AttacksPerSecond)

		calculVars[heroname] = {
			heroname: heroname,
			damage: finalDamage,
			dps: Math.round(finalDamage*myStats.AttacksPerSecond),
			time4Win: time4Win,
			versusWin: (time4Win < enemyTime4Win?true:false)
		}
	}

	var a = ObjectToArray(calculVars)

	if (a.length < 5) return

	var Mainpanel = Game.Panels.DamageCalculator
	for(var i=0; i<a.length; i++) {
		var el = a[i]

		var p = Mainpanel.Children()[i]

		var heroname = p.Children()[0]
		var damage = p.Children()[1]
		var dps = p.Children()[2]
		var versusWin = p.Children()[3]
		var time4Win = p.Children()[4]

		heroname.heroname = el.heroname
		damage.text = 'Damage: '+String(el.damage)
		dps.text = 'DPS: '+String(el.dps)
		versusWin.text = '1v1Win: '+String(el.versusWin)
		time4Win.text = 'time4Win: '+String(el.time4Win)
	}
}


var DamageCalculatorUI = function(){
	Game.GetFile('DamageCalculator/panel.xml', function(a){
		Game.Panels.DamageCalculator = $.CreatePanel( 'Panel', Game.GetMainHUD(), 'DamageCalculator1' )
		Game.Panels.DamageCalculator.BLoadLayoutFromString( a, false, false )
	
		GameUI.MovePanel(Game.Panels.DamageCalculator,function(p){
			var position = p.style.position.split(' ')
			Config.MainPanel.x = position[0]
			Config.MainPanel.y = position[1]
			Game.SaveConfig('DamageCalculator/config.conf', Config)
		})
		Game.GetConfig('DamageCalculator/config.conf',function(a){
			Config = a
			Game.Panels.DamageCalculator.style.position = Config.MainPanel.x + ' ' + Config.MainPanel.y + ' 0'
		});
	})
}

var DamageCalculatorOnCheckBoxClick = function(){
	if ( !DamageCalculator.checked ){
		calculVars = {}
		Game.Panels.DamageCalculator.DeleteAsync(0)
		Game.ScriptLogMsg('Script disabled: DamageCalculator', '#ff0000')
		return
	}
	//рисуеи гуи
	DamageCalculatorUI()

	//циклически замкнутый таймер с проверкой условия с интервалом 'interval'
	function maincheck(){ $.Schedule( interval,function(){
		DamageCalculatorFunc()
		if(DamageCalculator.checked)
			maincheck()
	})}
	maincheck()
	Game.ScriptLogMsg('Script enabled: DamageCalculator', '#00ff00')
}

//шаблонное добавление чекбокса в панель
var Temp = $.CreatePanel( "Panel", $('#scripts'), "DamageCalculator" )
Temp.SetPanelEvent( 'onactivate', DamageCalculatorOnCheckBoxClick )
Temp.BLoadLayoutFromString( '<root><styles><include src="s2r://panorama/styles/dotastyles.vcss_c" /><include src="s2r://panorama/styles/magadan.vcss_c" /></styles><Panel><ToggleButton class="CheckBox" id="DamageCalculator" text="DamageCalculator"/></Panel></root>', false, false)  
var DamageCalculator = $.GetContextPanel().FindChildTraverse( 'DamageCalculator' ).Children()[0]