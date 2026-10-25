import * as Phaser from 'phaser';
import { NPC } from '../npc';
import { INPCData } from '../npc';

class Menu
{
    menu_blur: Phaser.Filters.Blur;
    btns: Phaser.GameObjects.Container[];
};

function createButton(scene: Phaser.Scene, x: number, y: number, text: string, onClick: Function): Phaser.GameObjects.Container {
    const bg = scene.add.sprite(0, 0, 'button', 0)
        .setInteractive({ useHandCursor: true })
        .setScale(2);
    const label = scene.add.text(0, -5, text, {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        color: '#fff',
        stroke: '#000',
        strokeThickness: 2,
    }).setOrigin(0.5);

    bg.on('pointerover', () => { bg.setFrame(1); label.setY(0); })
        .on('pointerout', () => { bg.setFrame(0); label.setY(-4); })
        .on('pointerdown', () => { bg.setFrame(1); label.setY(0); })
        .on('pointerup', () => { onClick(); });

    return scene.add.container(x, y, [bg, label]);
}

function createButtons(scene: Phaser.Scene, data: {text: string, onClick: Function}[]): Phaser.GameObjects.Container[] {
    data.reverse();

    const result: Phaser.GameObjects.Container[] = [];

    const camera = scene.cameras.main;
    let y = camera.height - 24;
    for (let index = 0; index < data.length; index++) {
        const element = data[index];
        result.push(createButton(scene, 75, y, element.text, element.onClick));
        y -= 24;
    }

    return result;
}

function exitMenu(scene: Game) {
    // if (menu.btns.length === 0 || menu.btns[0].alpha === 0) return;

    //menu.btns[0].setInteractive(false);

    // Анимация блюра
    scene.tweens.add({
        targets: scene.menuBlur,
        strength: 0, 
        duration: 2000,
        ease: 'Linear'
    });

    // Анимация кнопок
    scene.tweens.add({
        targets: scene.uiLayer.list,
        alpha: 0,
        duration: 1000,
        ease: 'Linear',
        onComplete: () => {
            // Уничтожаем кнопки и очищаем UI-слой
            scene.uiLayer.list.forEach((child: any) => child.destroy());
            //scene.uiLayer.clear(true, true); // true, true = удалить всех детей и очистить массив
            
            // На всякий случай отключаем вторую камеру, она больше не нужна
            // scene.uiCamera.setVisible(false);
        }
    });

    scene.isGameStarted = true;
}

function createAnimatedObject(scene: Phaser.Scene, x: number, y: number, animKey: string): Phaser.GameObjects.Sprite {
    const sprite = scene.add.sprite(x, y, 'fire');
    sprite.play(animKey); // Запускаем анимацию
    return sprite;
}

// Функция для управления затемнением
// scene - ваша сцена Game, config - настройки (цвет, прозрачность, время)
export function toggleDarkening(
    scene: Phaser.Scene, 
    show: boolean, 
    config = { color: 0x000000, alpha: 0.7, duration: 300 }
): Promise<void> {
    
    // Если затемнение еще не создано, создаем его
    if (!scene.data.get('darkOverlay')) {
        // Создаем прямоугольник на весь экран (320x180)
        const overlay = scene.add.rectangle(160, 90, 320, 180, config.color, 0)
            .setOrigin(0.5)
            .setDepth(100); // Поверх всего в UI-слое
        
        // Добавляем в uiLayer, чтобы gameCamera (с блюром) его не видела
        // ВАЖНО: uiLayer должен быть доступен в сцене
        (scene as any).uiLayer.add(overlay); 
        scene.data.set('darkOverlay', overlay);
    }

    const overlay = scene.data.get('darkOverlay') as Phaser.GameObjects.Rectangle;

    // Анимируем прозрачность (альфу)
    return new Promise((resolve) => {
        scene.tweens.add({
            targets: overlay,
            alpha: show ? config.alpha : 0,
            duration: config.duration,
            ease: 'Power2',
            onComplete: () => resolve()
        });
    });
}

// Создание NPC
export function createNPC(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    npcId: string, 
    npcData: INPCData, 
    onInteract: (npc: NPC) => void
): Phaser.GameObjects.Image {
    
    const npc = new NPC(npcId, npcData);
    
    // Создаем спрайт
    const sprite = scene.add.image(x, y, npcData.smallImage)
        .setInteractive({ useHandCursor: true });

    // Добавляем эффекты наведения
    sprite.on('pointerover', () => sprite.setTint(0xcccccc));
    sprite.on('pointerout', () => sprite.clearTint());

    // Обработка клика
    sprite.on('pointerdown', () => {
        // Вызываем переданную функцию (например, открытие диалога)
        onInteract(npc);
    });

    return sprite;
}

// Удаление NPC
export function removeNPC(
    scene: Phaser.Scene, 
    npcSprite: Phaser.GameObjects.Image
): Promise<void> {
    // Просто удаляем спрайт со сцены и из памяти
    npcSprite.destroy();
    
    // Возвращаем промис, чтобы вызывающий код знал, когда удаление завершено
    return Promise.resolve();
}

function createInteractiveObject(scene: Game, x: number, y: number, texture: string, id: string, onClick: Function): Phaser.GameObjects.Image {
    const obj = scene.add.image(x, y, texture);
    
    // Делаем объект полностью прозрачным при создании
    obj.setAlpha(0.001); 

    // Делаем объект кликабельным и меняем курсор на "руку"
    obj.setInteractive({ useHandCursor: true });

    // Эффект при наведении: плавно проявляем
    obj.on('pointerover', () => {
        if (!(scene as any).isGameStarted) return;
        scene.tweens.add({
            targets: obj,
            alpha: 1,      // Проявляем до 100%
            duration: 200, // За 200 мс (0.2 сек)
            ease: 'Power2'
        });
    });

    // Эффект при уходе курсора: плавно скрываем
    obj.on('pointerout', () => {
        if (!(scene as any).isGameStarted) return;
        scene.tweens.add({
            targets: obj,
            alpha: 0.001,      // Скрываем обратно
            duration: 200,
            ease: 'Power2'
        });
    });

    // Действие при клике
    obj.on('pointerdown', () => {
        if (!(scene as any).isGameStarted) return;

        scene.actionId = id;
        scene.time.delayedCall(2, () => {scene.pendingInteraction = onClick;})

        scene.targetX = obj.x;

        // Анимация легкого нажатия
        scene.tweens.add({
            targets: obj,
            scale: 0.999,
            yoyo: true,
            duration: 100,
            //onComplete: () => onClick()
        });
    });

    return obj;
}

function openBook(): void {};

function rest(): void {};

function apointment(): void {};

export class Game extends Phaser.Scene
{
    actionId: string | null = null;
    pendingInteraction: Function | null = null;
    gameLayer!: Phaser.GameObjects.Layer;
    uiLayer!: Phaser.GameObjects.Layer;
    gameCamera!: Phaser.Cameras.Scene2D.Camera;
    uiCamera!: Phaser.Cameras.Scene2D.Camera;
    menuBlur!: Phaser.Filters.Blur;
    camera!: Phaser.Cameras.Scene2D.Camera;
    background!: Phaser.GameObjects.Image;
    menu!: Menu;
    hero!: Phaser.GameObjects.Sprite;
    targetX!: number;
    isGameStarted: boolean = false;
    npcList: string[];
    npcsData: Record<string, INPCData>;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        // Огонь
        if (!this.anims.exists('fire_anim')) {
            this.anims.create({
                key: 'fire_anim',
                frames: this.anims.generateFrameNumbers('fire', { start: 0, end: 2 }), // 4 кадра
                frameRate: 4, // Скорость (4щщ кадров в секунду)
                repeat: -1    // Зациклить навсегда
            });
        }

        // ГГ
        if (!this.anims.exists('hero_walk')) {
            this.anims.create({
                key: 'hero_walk',
                frames: this.anims.generateFrameNumbers('hero', { start: 1, end: 4 }), // Кадры 0, 1, 2, 3
                frameRate: 4, // Скорость анимации (8 кадров в секунду)
                repeat: -1    // Зациклено
            });
        }

        // Создаем героя
        this.hero = this.add.sprite(540, 325, 'hero');
        this.hero.setOrigin(0.5, 1); 
        this.hero.setFrame(0); // Статичный кадр
        this.targetX = this.hero.x; 
        // this.hero.setScale(2.5);

        const book = createInteractiveObject(this, 66, 258, 'book_outline', 'book', () => {
            openBook();
        });

        const couch = createInteractiveObject(this, 190, 295, 'k_outline', 'couch', () => {
            apointment();
        });

        const bed = createInteractiveObject(this, 578, 290, 'bed_outline', 'bed', () => {
            rest();
        });

        // Получаем список ID (например, ["doctor", "patient"])
        this.npcList = this.cache.json.get('npcList') as string[];
        // Получаем сами данные NPC (объект, где ключ — это ID)
        this.npcsData = this.cache.json.get('npcsData') as Record<string, INPCData>;

        // 1. Создаем камеры
        this.gameCamera = this.cameras.main;
        this.uiCamera = this.cameras.add(0, 0, 640, 360); // Размеры вашей игры
        
        // 2. Создаем два слоя для порядка: мир и UI
        this.gameLayer = this.add.layer();
        this.uiLayer = this.add.layer();

        // 3. Настраиваем главную камеру (она станет нашей gameCamera)
        this.background = this.add.image(320, 180, 'background');
        this.gameLayer.add(this.background);
        const fire = createAnimatedObject(this, 462, 285, 'fire_anim');
        this.gameLayer.add(fire);
        this.gameLayer.add(bed);
        this.gameLayer.add(couch);
        this.gameLayer.add(book);
        this.gameLayer.add(this.hero);

        // 4. Распределяем, что какая камера должна игнорировать
        // gameCamera не должна видеть элементы UI
        this.gameCamera.ignore(this.uiLayer);
        // uiCamera не должна видеть игровой мир
        this.uiCamera.ignore(this.gameLayer);

        // 5. Добавляем кнопки в uiLayer
        const btns = createButtons(this, [{text: 'Новая игра', onClick: () => exitMenu(this)}]);
        btns.forEach(btn => this.uiLayer.add(btn));

        // 6. Применяем фильтр размытия ТОЛЬКО к gameCamera
        // Фильтры на камерах в Phaser 4 включены по умолчанию[reference:2]
        const blur = this.gameCamera.filters.external.addBlur(1, 2, 2, 0.5);
        this.menuBlur = blur;

        this.menu = {
            menu_blur: this.menuBlur,
            btns: btns,
        };

        this.time.delayedCall(100, () => {
            this.menu.btns.forEach((btnContainer) => {
                // Ищем внутри контейнера объект типа Text
                const label = btnContainer.list.find(
                    (child) => child instanceof Phaser.GameObjects.Text
                ) as Phaser.GameObjects.Text;

                // Если нашли — обновляем текстуру
                if (label) {
                    label.updateText();
                }
            });
        });



        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (!this.isGameStarted) return;
            if (pointer.x < this.scale.width && pointer.y > this.scale.height / 2) {
                // Ограничиваем клик краями экрана (чтобы не ушел за экран)
                this.targetX = Phaser.Math.Clamp(pointer.x, 16, this.scale.width - 16);

                // ВАЖНО: Отменяем запланированное взаимодействие, 
                // так как игрок кликнул мимо объекта
                this.actionId = null;
                this.pendingInteraction = null;
            }
        })
    }

    update(time: number, delta: number) {
        if (!this.hero || !this.isGameStarted) return;

        const speed = 100; // Пикселей в секунду
        const distance = this.targetX - this.hero.x;
        const threshold = 2; // Порог остановки

        // Если расстояние до цели больше порога — двигаемся
        if (Math.abs(distance) > threshold) {
            
            // delta — это время, прошедшее с прошлого кадра (в миллисекундах).
            // Делим на 1000, чтобы получить долю секунды.
            // Это гарантирует, что скорость не будет зависеть от FPS.
            const moveAmount = speed * (delta / 1000); 

            if (distance > 0) {
                this.hero.x += moveAmount; // Вправо
                this.hero.setFlipX(false);
            } else {
                this.hero.x -= moveAmount; // Влево
                this.hero.setFlipX(true);
            }

            // Защита от "перелета" цели (если шаг больше, чем осталось идти)
            if (Math.abs(this.targetX - this.hero.x) <= moveAmount) {
                this.hero.x = this.targetX;
            }

            // Анимация ходьбы
            if (!this.hero.anims.isPlaying) {
                this.hero.play('hero_walk');
            }

        } else {
            // Дошли до цели — стоим
            this.hero.x = this.targetX;
            
            if (this.hero.anims.isPlaying) {
                this.hero.stop();
                this.hero.setFrame(0);
            }

            // Выполняем функцию
            if (this.pendingInteraction != null) { this.pendingInteraction(); }
            
            // ОЧИЩАЕМ СОСТОЯНИЕ, чтобы не выполнить действие повторно
            this.actionId = null;
            this.pendingInteraction = null;
        }

        // 4. РУЧНАЯ КОЛЛИЗИЯ С КРАЯМИ ЭКРАНА
        // Ограничиваем X героя так, чтобы он не вылезал за границы
        const minX = 8; // Половина ширины спрайта (если спрайт 16px)
        const maxX = this.scale.width - 8;
        this.hero.x = Phaser.Math.Clamp(this.hero.x, minX, maxX);
    }
}
