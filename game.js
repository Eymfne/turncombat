class Skill {
    constructor(name, fpCost, damage, specialEffect = null) {
        this.name = name;
        this.fpCost = fpCost;
        this.damage = damage;
        this.specialEffect = specialEffect;
    }
}

const skills = {
    attack: new Skill('Attack', 10, 20),
    special: new Skill('Special Skill', 20, 40),
    fireball: new Skill('Fireball', 15, 30, 'burn'),
    heal: new Skill('Heal', 10, -30),
    iceBlast: new Skill('Ice Blast', 20, 25, 'freeze'),
    shock: new Skill('Shock', 20, 15, 'shock'),
    thunderStrike: new Skill('Thunder Strike', 25, 35, 'shock'),
    poisonDart: new Skill('Poison Dart', 15, 10, 'poison')
};

class Item {
    constructor(name, type, effect, cost) {
        this.name = name;
        this.type = type; // 'weapon', 'armor', 'potion', etc.
        this.effect = effect; // {damage: 10, defense: 5, etc.}
        this.cost = cost;
    }
}

const weapons = {
    sword: new Item('Sword', 'weapon', {damage: 10}, 50),
    axe: new Item('Axe', 'weapon', {damage: 15}, 75),
    staff: new Item('Staff', 'weapon', {damage: 5, magic: 10}, 60)
};

const armors = {
    shield: new Item('Shield', 'armor', {defense: 10}, 50),
    helmet: new Item('Helmet', 'armor', {defense: 5}, 30),
    armor: new Item('Armor', 'armor', {defense: 15}, 70)
};

const items = {
    healingPotion: new Item('Healing Potion', 'potion', {heal: 30}, 20),
    magicPotion: new Item('Magic Potion', 'potion', {recoverFP: 20}, 20)
};

class Character {
    constructor(name, hp, fp) {
        this.name = name;
        this.hp = hp;
        this.fp = fp;
        this.maxHp = hp;
        this.maxFp = fp;
        this.status = 'Normal';
        this.statusEffects = {};
        this.weapon = null;
        this.armor = null;
    }

    takeDamage(damage) {
        const actualDamage = Math.max(damage - (this.armor ? this.armor.effect.defense : 0), 0);
        this.hp = Math.max(this.hp - actualDamage, 0);
    }

    useFP(amount) {
        if (this.fp >= amount) {
            this.fp -= amount;
            return true;
        } else {
            return false;
        }
    }

    recoverFP(amount) {
        this.fp = Math.min(this.fp + amount, this.maxFp);
    }

    updateStatus(newStatus) {
        this.status = newStatus;
    }

    applySkill(skill) {
        if (this.useFP(skill.fpCost)) {
            const damage = skill.damage + (this.weapon ? this.weapon.effect.damage : 0);
            return damage;
        } else {
            this.takeDamage(skill.fpCost / 2);
            return 0;
        }
    }

    addStatusEffect(effect, turns) {
        this.statusEffects[effect] = turns;
    }

    applyStatusEffects() {
        Object.keys(this.statusEffects).forEach(effect => {
            if (this.statusEffects[effect] > 0) {
                if (effect === 'burn') {
                    this.takeDamage(Math.floor(this.maxHp * 0.2));
                } else if (effect === 'freeze') {
                    if (Math.random() < 0.2) {
                        this.status = 'Frozen';
                    }
                } else if (effect === 'shock') {
                    this.takeDamage(Math.floor(this.maxHp * 0.05));
                } else if (effect === 'poison') {
                    this.takeDamage(Math.floor(this.maxHp * 0.1));
                }
                this.statusEffects[effect] -= 1;
            }
        });
    }
}

const player = new Character('Player', 100, 50);
let currentStage = 1;
let enemy;
let inventory = [];
let leaves = 0;
let saveData = null;
let levelUpCost = 50;

function setupStage(stage) {
    if (stage % 10 === 0) {
        enemy = new Character('Legendary Boss', 300 + stage * 20, 100 + stage * 10);
        logCombat(`Stage ${stage}: A legendary boss appears!`);
    } else if (stage % 5 === 0) {
        enemy = new Character('Main Boss', 200 + stage * 15, 80 + stage * 8);
        logCombat(`Stage ${stage}: A main boss appears!`);
    } else if (stage % 3 === 0) {
        enemy = new Character('Mid Boss', 150 + stage * 10, 60 + stage * 6);
        logCombat(`Stage ${stage}: A mid boss appears!`);
    } else {
        enemy = new Character(`Enemy ${stage}`, 100 + stage * 5, 50 + stage * 5);
        logCombat(`Stage ${stage}: An enemy appears!`);
    }
    updateStats();
}

function updateStats() {
    document.getElementById('player-hp-bar').style.width = `${(player.hp / player.maxHp) * 100}%`;
    document.getElementById('player-fp-bar').style.width = `${(player.fp / player.maxFp) * 100}%`;
    document.getElementById('player-status').innerText = `Status: ${player.status}`;

    document.getElementById('enemy-hp-bar').style.width = `${(enemy.hp / enemy.maxHp) * 100}%`;
    document.getElementById('enemy-fp-bar').style.width = `${(enemy.fp / enemy.maxFp) * 100}%`;
    document.getElementById('enemy-status').innerText = `Status: ${enemy.status}`;
}

function logCombat(message) {
    const combatLog = document.getElementById('combat-log');
    combatLog.innerHTML += `<p>${message}</p>`;
    combatLog.scrollTop = combatLog.scrollHeight;
}

function useSkill(skillName) {
    const skill = skills[skillName];
    const damage = player.applySkill(skill);

    if (damage > 0) {
        enemy.takeDamage(damage);
        logCombat(`Player used ${skill.name}. Enemy took ${damage} damage.`);
    } else {
        logCombat(`Player tried to use ${skill.name} but didn't have enough FP.`);
    }

    if (skill.specialEffect) {
        enemy.addStatusEffect(skill.specialEffect, 3);
    }

    if (enemy.hp <= 0) {
        logCombat('Enemy defeated!');
        grantRewards();
        nextStage();
        saveGame();
    } else {
        enemyTurn();
    }
    updateStats();
}

function recoverFP() {
    player.recoverFP(20);
    logCombat('Player recovered 20 FP.');
    enemyTurn();
    updateStats();
}

function useItem(itemName) {
    if (!inventory.includes(itemName)) {
        logCombat('No such item in inventory.');
        return;
    }
    const item = items[itemName];
    if (item.type === 'potion') {
        if (item.effect.heal) {
            player.hp = Math.min(player.hp + item.effect.heal, player.maxHp);
            logCombat(`Player used a ${item.name}. Recovered ${item.effect.heal} HP.`);
        } else if (item.effect.recoverFP) {
            player.recoverFP(item.effect.recoverFP);
            logCombat(`Player used a ${item.name}. Recovered ${item.effect.recoverFP} FP.`);
        }
        inventory = inventory.filter(i => i !== itemName);
    }
    enemyTurn();
    updateStats();
}

function enemyTurn() {
    if (enemy.hp <= 0) {
        return;
    }
    const enemyAction = Math.random();
    if (enemyAction < 0.3) {
        useEnemySkill('attack');
    } else if (enemyAction < 0.5) {
        useEnemySkill('fireball');
    } else if (enemyAction < 0.7) {
        useEnemySkill('iceBlast');
    } else {
        enemy.recoverFP(20);
        logCombat('Enemy recovered 20 FP.');
    }
    if (player.hp <= 0) {
        logCombat('Player is defeated. YOU DIE.');
        loadGame();
    }
}

function useEnemySkill(skillName) {
    const skill = skills[skillName];
    const damage = enemy.applySkill(skill);

    if (damage > 0) {
        player.takeDamage(damage);
        logCombat(`Enemy used ${skill.name}. Player took ${damage} damage.`);
    } else {
        enemy.takeDamage(skill.fpCost / 2);
        logCombat(`Enemy tried to use ${skill.name} but didn't have enough FP.`);
    }

    if (skill.specialEffect) {
        player.addStatusEffect(skill.specialEffect, 3);
    }
}

function nextStage() {
    currentStage++;
    setupStage(currentStage);
    player.hp = player.maxHp;
    player.fp = player.maxFp;
    leaves += 10; // 예시: 스테이지 클리어 시 나뭇잎 획득
    logCombat(`Player recovered full HP and FP. Earned 10 leaves.`);
}

function grantRewards() {
    const rewards = Object.keys(weapons).concat(Object.keys(armors), Object.keys(items));
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    inventory.push(reward);
    logCombat(`Player received a ${reward} as a reward.`);
}

function openInventory() {
    document.getElementById('inventory-modal').style.display = 'block';
    updateInventory();
}

function closeInventory() {
    document.getElementById('inventory-modal').style.display = 'none';
}

function updateInventory() {
    const inventoryItems = document.getElementById('inventory-items');
    inventoryItems.innerHTML = '';
    inventory.forEach(item => {
        const itemElement = document.createElement('p');
        itemElement.innerText = item;
        inventoryItems.appendChild(itemElement);
    });
}

function levelUp() {
    if (leaves < levelUpCost) {
        logCombat(`Not enough leaves to level up. ${levelUpCost} leaves required.`);
        return;
    }
    leaves -= levelUpCost;
    levelUpCost = Math.ceil(levelUpCost * 1.5);
    player.maxHp += 10;
    player.maxFp += 5;
    logCombat(`Player leveled up! Max HP and FP increased. Next level up costs ${levelUpCost} leaves.`);
    updateStats();
    closeInventory();
}

function openShop() {
    document.getElementById('shop-modal').style.display = 'block';
    updateShopItems();
}

function closeShop() {
    document.getElementById('shop-modal').style.display = 'none';
}

function updateShopItems() {
    const shopItems = document.getElementById('shop-items');
    shopItems.innerHTML = '';

    Object.keys(weapons).forEach(key => {
        const weapon = weapons[key];
        const itemElement = document.createElement('div');
        itemElement.innerHTML = `<p>${weapon.name} - Damage: ${weapon.effect.damage} - Cost: ${weapon.cost} leaves <button onclick="buyItem('${key}', 'weapon')">Buy</button></p>`;
        shopItems.appendChild(itemElement);
    });

    Object.keys(armors).forEach(key => {
        const armor = armors[key];
        const itemElement = document.createElement('div');
        itemElement.innerHTML = `<p>${armor.name} - Defense: ${armor.effect.defense} - Cost: ${armor.cost} leaves <button onclick="buyItem('${key}', 'armor')">Buy</button></p>`;
        shopItems.appendChild(itemElement);
    });

    Object.keys(items).forEach(key => {
        const item = items[key];
        const itemElement = document.createElement('div');
        itemElement.innerHTML = `<p>${item.name} - Effect: ${JSON.stringify(item.effect)} - Cost: ${item.cost} leaves <button onclick="buyItem('${key}', 'item')">Buy</button></p>`;
        shopItems.appendChild(itemElement);
    });
}

function buyItem(key, type) {
    let item;
    if (type === 'weapon') {
        item = weapons[key];
    } else if (type === 'armor') {
        item = armors[key];
    } else if (type === 'item') {
        item = items[key];
    }

    if (leaves >= item.cost) {
        leaves -= item.cost;
        inventory.push(key);
        logCombat(`Bought ${item.name} for ${item.cost} leaves.`);
        updateShopItems();
        updateInventory();
    } else {
        logCombat('Not enough leaves to buy this item.');
    }
}

function saveGame() {
    saveData = {
        player: {
            hp: player.hp,
            fp: player.fp,
            maxHp: player.maxHp,
            maxFp: player.maxFp,
            status: player.status,
            statusEffects: player.statusEffects,
            weapon: player.weapon,
            armor: player.armor
        },
        currentStage,
        enemy: {
            hp: enemy.hp,
            fp: enemy.fp,
            maxHp: enemy.maxHp,
            maxFp: enemy.maxFp,
            status: enemy.status,
            statusEffects: enemy.statusEffects
        },
        inventory,
        leaves,
        levelUpCost
    };
    localStorage.setItem('saveData', JSON.stringify(saveData));
    logCombat('Game saved!');
}

function loadGame() {
    const savedData = localStorage.getItem('saveData');
    if (savedData) {
        saveData = JSON.parse(savedData);
        player.hp = saveData.player.hp;
        player.fp = saveData.player.fp;
        player.maxHp = saveData.player.maxHp;
        player.maxFp = saveData.player.maxFp;
        player.status = saveData.player.status;
        player.statusEffects = saveData.player.statusEffects;
        player.weapon = saveData.player.weapon;
        player.armor = saveData.player.armor;
        currentStage = saveData.currentStage;
        enemy.hp = saveData.enemy.hp;
        enemy.fp = saveData.enemy.fp;
        enemy.maxHp = saveData.enemy.maxHp;
        enemy.maxFp = saveData.enemy.maxFp;
        enemy.status = saveData.enemy.status;
        enemy.statusEffects = saveData.enemy.statusEffects;
        inventory = saveData.inventory;
        leaves = saveData.leaves;
        levelUpCost = saveData.levelUpCost;
        logCombat('Game loaded!');
        updateStats();
    } else {
        logCombat('No saved game data found.');
    }
}

function upgradeWeapon() {
    if (leaves < 30) {
        logCombat('Not enough leaves to upgrade weapon.');
        return;
    }
    leaves -= 30;
    player.weapon.effect.damage += 5;
    logCombat(`Weapon upgraded! New damage: ${player.weapon.effect.damage}`);
}

function upgradeArmor() {
    if (leaves < 30) {
        logCombat('Not enough leaves to upgrade armor.');
        return;
    }
    leaves -= 30;
    player.armor.effect.defense += 5;
    logCombat(`Armor upgraded! New defense: ${player.armor.effect.defense}`);
}

function openSettings() {
    document.getElementById('settings-modal').style.display = 'block';
}

function closeSettings() {
    document.getElementById('settings-modal').style.display = 'none';
}

function changeBackgroundImage(event) {
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('background').style.backgroundImage = `url(${e.target.result})`;
    }
    reader.readAsDataURL(event.target.files[0]);
}

function changePlayerImage(event) {
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('player-image').src = e.target.result;
    }
    reader.readAsDataURL(event.target.files[0]);
}

function changeEnemyImage(event) {
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('enemy-image').src = e.target.result;
    }
    reader.readAsDataURL(event.target.files[0]);
}

// 처음 게임 로드시 자동으로 저장된 게임 불러오기 시도
window.onload = loadGame;

setupStage(currentStage);
updateStats();


document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll("button").forEach(function(button) {
        button.addEventListener("click", function() {
            console.log(button.innerText + " clicked");
        });
    });
});

function openSettings() {
    document.getElementById('settings-modal').style.display = 'block';
}

function closeSettings() {
    document.getElementById('settings-modal').style.display = 'none';
}

function openInventory() {
    document.getElementById('inventory-modal').style.display = 'block';
}

function closeInventory() {
    document.getElementById('inventory-modal').style.display = 'none';
}

function openShop() {
    document.getElementById('shop-modal').style.display = 'block';
}

function closeShop() {
    document.getElementById('shop-modal').style.display = 'none';
}

function changeBackgroundImage(event) {
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('background').style.backgroundImage = `url(${e.target.result})`;
    }
    reader.readAsDataURL(event.target.files[0]);
}

function changePlayerImage(event) {
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('player-image').src = e.target.result;
    }
    reader.readAsDataURL(event.target.files[0]);
}

function changeEnemyImage(event) {
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('enemy-image').src = e.target.result;
    }
    reader.readAsDataURL(event.target.files[0]);
}

// 예시로 버튼 클릭을 테스트하기 위한 로그 추가
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
        console.log(button.textContent + ' clicked');
    });
});
