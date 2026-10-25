import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        const bg = this.add.image(320, 180, 'background');
        bg.enableFilters();
        bg.filters!.external.addBlur(1, 2, 2, 0.5);

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(320, 180, 276, 8).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(320-136, 180, 4, 8, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress: number) => {

            //  Update the progress bar (our bar is 270px wide, so 100% = 274px)
            bar.width = 4 + (270 * progress);

        });
    }

    preload ()
    {
        this.load.setBaseURL('assets/');

        this.load.spritesheet('fire', 'fire.png', { 
            frameWidth: 26, 
            frameHeight: 22 
        });

        this.load.spritesheet('hero', 'kostya.png', { 
            frameWidth: 48, 
            frameHeight: 98
        });

        this.load.image('book_outline', 'book-outline.png');
        this.load.image('k_outline', 'kushetka-outline.png');
        this.load.image('bed_outline', 'bed-outline.png');

        this.load.json('npcsData', 'npc/data/npc.json');
        this.load.json('npcList', 'npc/data/npc_list.json');

        this.load.font('"Press Start 2P"')
        this.load.spritesheet('button', 'button.png', {frameWidth: 66, frameHeight: 16});

        // 2. Магия: как только JSON загрузился, читаем его и грузим картинки
        this.load.on('filecomplete-json-npcsData', (key: string, type: string, data: any) => {
            for (const npcId in data) {
                const npc = data[npcId];
                
                // Добавляем слэш в начало, чтобы путь был от корня сайта (Vite)
                const smallPath = npc.smallImage;
                const closeUpPath = npc.closeUpImage;

                // Грузим картинку. Ключом делаем сам путь (например, "npc/images/simple/nameless.png")
                // Проверяем, не загружена ли она уже, чтобы не было дублей
                if (!this.textures.exists(npc.smallImage)) {
                    this.load.image(npc.smallImage, smallPath);
                }
                if (!this.textures.exists(npc.closeUpImage)) {
                    this.load.image(npc.closeUpImage, closeUpPath);
                }
            }
        });
    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.


        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('Game');
    }
}
