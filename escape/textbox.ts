/// <reference path="../src/index.ts" />
/// <reference path="./mouse.ts" />
/// <reference path="./pin.ts" />
/// <reference path="./slide.ts" />
/// <reference path="./image.ts" />

namespace Textbox {

    const FONT_SIZE = 16;

    const BACKGROUND = RenderImage.load("img/dialog.png"); 

    export class Text implements Render.Renderable {
        public Location = new ECS.Location(0, 0);

        constructor(
            public Layer: Render.Layer,
            public Text: string
        ) { };

        render(cx: CanvasRenderingContext2D) {
            cx.fillStyle = "#fff";
            cx.font = `${FONT_SIZE}px Roboto, sans-serif`;
            cx.textAlign = "center";
            cx.textBaseline = "top";

            this.Location.transformCx(cx);

            let lines = this.Text.split("\n");
            let y = 0;

            lines.map(line => {
                cx.fillText(line, 0, y);
                y += FONT_SIZE;
            });
        };
    };
    export interface HasText {
        RenderText: Text
    };
    export function HasText(entity: any): entity is HasText {
        return entity.RenderText != null;
    };


    export class RenderTextSystem extends ECS.System<HasText> {

        constructor(
            public renderer: Render.RenderList
        ) {
            super(HasText);
        };

        process(entity: HasText) {
            if (ECS.HasLocation(entity)) {
                entity.RenderText.Location = entity.Location;
            }
            this.renderer.add(entity.RenderText);
        };

    };

    const SLIDE_SPEED = 50;
    export function MessageBox(
        entities: ECS.Entity[],
        bgLayer: Render.Layer,
        layer: Render.Layer,
        text: string,
        callback: () => void = null
    ) {

        let root = {
            deleted: false,
            Location: new ECS.Location(500, 0),
            RenderImage: new RenderImage.RenderImage(bgLayer, BACKGROUND, 0, 0, 500, 400)
        };
        Slide.Slide(root, 0, 0, SLIDE_SPEED);

        let message = {
            deleted: false,
            RenderText: new Text(layer, text)
        };

        Pin.Attach(root, message, 250,50+FONT_SIZE);

        let dismissBox = new Render.Box(210, 225, 80, 30);
        let dismissButton = {
            deleted: false,
            ClickTarget: new Mouse.ClickTarget(
                Mouse.UiLayer.Textbox,
                dismissBox,
                clickedWith => Slide.Slide(root, -500, 0, SLIDE_SPEED, () => {
                    root.deleted = true;
                    message.deleted = true;
                    dismissButton.deleted = true;
                    if(callback) {
                        callback();
                    }
                })
            )
        };

        Pin.Attach(root, dismissButton, 0, 0);

        entities.push(root, message, dismissButton);
    };

};
