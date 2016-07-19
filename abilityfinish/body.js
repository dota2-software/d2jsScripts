/*-----------------------------------------------
//////////////// vk.com/d2jscripts //////////////
/////////////////////////////////////////////////
втоматически прожимает ульт когда у вражеского 
 героя мало здоровья. Автоматически расчитывает 
 маг. резист, уровень ультимейта, наличие аганима 
 и де\бафов.
Автор: vk.com/exieros
/////////////////////////////////////////////////
-----------------------End---------------------*/

//интервал(в секундах) через который будет делаться проверка
var interval = 0.3

var LenseBonusRange = 200

var IgnoreBuffs = [
	"modifier_abaddon_borrowed_time",
	"modifier_brewmaster_primal_split",
	"modifier_omniknight_repel",
	"modifier_phoenix_supernova_hiding",
	"modifier_tusk_snowball_movement",
	"modifier_tusk_snowball_movement_friendly",
	"modifier_juggernaut_blade_fury",
	"modifier_medusa_stone_gaze",
	"modifier_nyx_assassin_spiked_carapace",
	"modifier_templar_assassin_refraction_absorb",
	"modifier_oracle_false_promise",
	"modifier_dazzle_shallow_grave",
	"modifier_treant_living_armor",
	"modifier_life_stealer_rage",
	"modifier_item_aegis"
]

//де\бафы на вражеских героях, умножающие маг. урон
var DebuffsAddMagicDmg = [
	["modifier_bloodthorn_debuff", 1.3],
	["modifier_orchid_malevolence_debuff", 1.3],
	["modifier_item_mask_of_madness_berserk", 1.25],
	["modifier_bloodseeker_bloodrage", [1.25,1.3,1.35,1.4]],
	["modifier_ursa_enrage", 0.2],
]

//бафы на вражеских героях, абсорбирующие определенное количество маг урона(не %)
var BuffsAbsorbMagicDmg = [
	["modifier_item_pipe_barrier", 400],
	["modifier_item_hood_of_defiance_barrier", 400],
	["modifier_item_infused_raindrop", 120],
	["modifier_abaddon_aphotic_shield", [110,140,170,200]],
	["modifier_ember_spirit_flame_guard", [50,200,350,500]]
]

//бафы на зевсе умножающие урон
var BuffsAddMagicDmgForMe = [
	["item_aether_lens", 1.05],
	["modifier_bloodseeker_bloodrage", [1.25,1.3,1.35,1.4]]
]

function entInfo(ent) {
	var info = {
		Health: Entities.GetHealth(ent),
		MaxHealth: Entities.GetMaxHealth(ent),
		Mana: Entities.GetMana(ent),
		MaxMana: Entities.GetMaxMana(ent),
		ArmorReductionForMagicalDamage: Entities.GetArmorReductionForDamageType(ent, DAMAGE_TYPES.DAMAGE_TYPE_MAGICAL),
		ArmorReductionForPhysicalDamage: Entities.GetArmorReductionForDamageType(ent, DAMAGE_TYPES.DAMAGE_TYPE_PHYSICAL)
	}

	return info
}

function magicAbildamage(info) {
	var MagicDamage = info.abilDmg
	//объект с именами бафов
	var buffsnames = Game.GetBuffsNames(ent)
	//базовый маг резист вражеского героя
	var MagicResist = Entities.GetArmorReductionForDamageType( ent, 2 )*100
	//объект с указателями на де\бафы вражеского героя
	var buffs = Game.GetBuffs(ent)
	//расчет доп. маг урона от дебафов у вражеского героя
	for(m in buffs)
		for(k in DebuffsAddMagicDmg)
			if(Buffs.GetName(ent,buffs[m]) === DebuffsAddMagicDmg[k][0])
				if(Array.isArray(DebuffsAddMagicDmg[k][1]))
					MagicDamage *= DebuffsAddMagicDmg[k][1][Abilities.GetLevel(Buffs.GetAbility(ent,buffs[i]))-1]
				else
					MagicDamage *= DebuffsAddMagicDmg[k][1]
	//объект с указателями на мои бафы
	var buffsme = Game.GetBuffs(MyEnt)
	//расчет доп. маг урона от бафов на зевсе
	for(m in buffsme)
		for(k in BuffsAddMagicDmgForMe)
			if(Buffs.GetName(ent,buffsme[m]) === BuffsAddMagicDmgForMe[k][0])
				if(Array.isArray(BuffsAddMagicDmgForMe[k][1]))
					MagicDamage *= BuffsAddMagicDmgForMe[k][1][Abilities.GetLevel(buffsme.GetAbility(ent,buffsme[i]))-1]
				else
					MagicDamage *= BuffsAddMagicDmgForMe[k][1]
				
	//отнимаем маг. урон из-за бафов, абсорбирующих часть урона
	for(m in buffs)
		for(k in BuffsAbsorbMagicDmg)
			if(Buffs.GetName(ent,buffs[m]) === BuffsAbsorbMagicDmg[k][0])
				if(Array.isArray(BuffsAbsorbMagicDmg[k][1]))
					MagicDamage -= BuffsAbsorbMagicDmg[k][1][Abilities.GetLevel(buffs.GetAbility(ent,buffs[i]))-1]
				else
					MagicDamage -= BuffsAddMagicDmgForMe[k][1]

	var clearDamage = MagicDamage - MagicDamage*info.ArmorReductionForMagicalDamage

	return info.Health < clearDamage
}

function physicAbildamage(info) {
	var clearDamage = info.abilDmg - info.abilDmg*info.ArmorReductionForPhysicalDamage

	return info.Health < clearDamage
}

var abilities = {
	'bounty_hunter_shuriken_toss': {
		damage: [150, 225, 300, 375],
		aganimDamage: [150, 225, 300, 375],
		function: magicAbildamage
	},
	'zuus_arc_lightning': {
		damage: [85, 100, 115, 145],
		aganimDamage: [85, 100, 115, 145],
		function: magicAbildamage
	},
	'sniper_assassinate': {
		damage: [320, 485, 650],
		aganimDamage: [320, 485, 650],
		function: magicAbildamage
	},
	'obsidian_destroyer_astral_imprisonment': {
		damage: [100, 175, 250, 325],
		aganimDamage: [100, 175, 250, 325],
		function: magicAbildamage
	},
	'dragon_knight_breathe_fire': {
		damage: [90, 170, 240, 300],
		aganimDamage: [90, 170, 240, 300],
		function: magicAbildamage
	},
	'sandking_burrowstrike': {
		damage: [100, 160, 220, 280],
		aganimDamage: [100, 160, 220, 280],
		function: magicAbildamage
	},
	'centaur_double_edge': {
		damage: [175, 250, 325, 400],
		aganimDamage: [175, 250, 325, 400],
		function: magicAbildamage
	},
	'lion_finger_of_death': {
		damage: [600, 725, 850],
		aganimDamage: [725, 875, 1025],
		function: magicAbildamage
	},
	'tidehunter_gush': {
		damage: [110, 160, 210, 260],
		aganimDamage: [110, 160, 210, 260],
		function: magicAbildamage
	},
	'centaur_hoof_stomp': {
		damage: [100, 150, 200, 250],
		aganimDamage: [100, 150, 200, 250],
		function: magicAbildamage
	},
	'nyx_assassin_impale': {
		damage: [80, 140, 200, 260],
		aganimDamage: [80, 140, 200, 260],
		function: magicAbildamage
	},
	'lina_laguna_blade': {
		damage: [450, 650, 850],
		aganimDamage: [450, 650, 850],
		function: function(info) {
			return (Entities.HasScepter(info.MyEnt)?physicAbildamage(info):magicAbildamage(info))
		}
	},
	'tinker_laser': {
		damage: [80, 160, 240, 320],
		aganimDamage: [80, 160, 240, 320],
		function: magicAbildamage
	},
	'zuus_lightning_bolt': {
		damage: [100, 175, 275, 350],
		aganimDamage: [100, 175, 275, 350],
		function: magicAbildamage
	},
	'luna_lucent_beam': {
		damage: [75, 160, 225, 300],
		aganimDamage: [75, 160, 225, 300],
		function: magicAbildamage
	},
	'vengefulspirit_magic_missile': {
		damage: [100, 175, 250, 325],
		aganimDamage: [100, 175, 250, 325],
		function: magicAbildamage
	},
	'bane_brain_sap': {
		damage: [90, 160, 230, 300],
		aganimDamage: [90, 160, 230, 300],
		function: magicAbildamage
	},
	'broodmother_spawn_spiderlings': {
		damage: [70, 140, 210, 280],
		aganimDamage: [70, 140, 210, 280],
		function: magicAbildamage
	},
	'mirana_starfall': {
		damage: [75, 150, 225, 300],
		aganimDamage: [75, 150, 225, 300],
		function: magicAbildamage
	},
	'sven_storm_bolt': {
		damage: [100, 175, 250, 325],
		aganimDamage: [100, 175, 250, 325],
		function: magicAbildamage
	},
	'skeleton_king_hellfire_blast': {
		damage: [50, 100, 150, 200],
		aganimDamage: [50, 100, 150, 200],
		function: magicAbildamage
	},
	'necrolyte_reapers_scythe': {
		damage: [0.6, 0.75, 0.9],
		aganimDamage: [0.6, 0.9, 1.2],
		function: function(info) {
			info.abilDmg = (info.MaxHealth-info.Health)*info.abilDmg
			return magicAbildamage(info)
		}
	},
	'zuus_thundergods_wrath': {
		damage: [225, 325, 425],
		aganimDamage: [440, 540, 640],
		function: magicAbildamage
	}

}

function abilityfinishFunc(){
	var MyEnt = Players.GetPlayerHeroEntityIndex(Game.GetLocalPlayerID())

	var abils = []

	for (var i=0;i<Entities.GetAbilityCount(MyEnt);i++) {
		var abil = Entities.GetAbility(MyEnt, i)
		var name = Abilities.GetAbilityName(abil)
		if (!abilities[name]) continue
		abils.push(name)
	}

	for (var i=0; i<abils.length; i++) {
		var abil = Entities.GetAbilityByName(MyEnt, abils[i])
		var abilRange = Abilities.GetCastRange(abil)
		if(Entities.HasItemInInventory(MyEnt, 'item_aether_lens'))
			abilRange+=LenseBonusRange
		var abilLvl = Abilities.GetLevel(abil)
		var abilCd = Abilities.GetCooldownTimeRemaining(abil)
		var abilDmg = Abilities.GetAbilityDamage(abil)
		var abilManaCost = Abilities.GetManaCost(abil)
		
		if(abilLvl==0 || abilCd > 0 || abilManaCost > Entities.GetMana(MyEnt)) continue		

		var Hents = Game.PlayersHeroEnts()
		for(var j=0; j<Hents.length; j++) {
			var ent = Hents[j]
			if(Entities.HasItemInInventory(ent, 'item_sphere')) {
				var sphere = Game.GetAbilityByName(ent, 'item_sphere')

				if (Abilities.GetCooldownTimeRemaining(sphere)-2 <= 0) continue
			}

			if( !Entities.IsEnemy(ent) || Entities.IsMagicImmune(ent) || !Entities.IsAlive(ent) || Entities.IsInvisible(ent) || Game.IntersecArrays(buffsnames, IgnoreBuffs)) continue


			var Range = Entities.GetRangeToUnit(MyEnt, ent)
			if(Range>abilRange) continue

			var info = entInfo(ent)

			info.MyEnt = MyEnt
			info.abilDmg = (Entities.HasScepter(MyEnt)?abilities[abils[i]].aganimDamage[abilLvl-1]:abilities[abils[i]].damage[abilLvl-1])

			if (abilities[abils[i]].function(info)) {
				GameUI.SelectUnit(MyEnt, false)
				Game.CastTarget(MyEnt, abil, ent, false)
			}
		}
	}
}

var abilityfinishOnCheckBoxClick = function(){
	if ( !abilityfinish.checked ){
		Game.Panels.abilityfinish.DeleteAsync(0)
		Game.ScriptLogMsg('Script disabled: abilityfinish', '#ff0000')
		return
	}

	function maincheck(){ $.Schedule( interval,function(){
		abilityfinishFunc()
		if(abilityfinish.checked)
			maincheck()
	})}
	maincheck()
	Game.ScriptLogMsg('Script enabled: abilityfinish', '#00ff00')
}

//шаблонное добавление чекбокса в панель
var Temp = $.CreatePanel( "Panel", $('#scripts'), "abilityfinish" )
Temp.SetPanelEvent( 'onactivate', abilityfinishOnCheckBoxClick )
Temp.BLoadLayoutFromString( '<root><styles><include src="s2r://panorama/styles/dotastyles.vcss_c" /><include src="s2r://panorama/styles/magadan.vcss_c" /></styles><Panel><ToggleButton class="CheckBox" id="abilityfinish" text="abilityfinish"/></Panel></root>', false, false)  
var abilityfinish = $.GetContextPanel().FindChildTraverse( 'abilityfinish' ).Children()[0]
