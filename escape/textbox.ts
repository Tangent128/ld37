/// <reference path="../src/index.ts" />
/// <reference path="./mouse.ts" />
/// <reference path="./pin.ts" />
/// <reference path="./slide.ts" />

namespace Textbox {

    const FONT_SIZE = 16;

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
            cx.textBaseline = "bottom";

            this.Location.transformCx(cx);
            cx.fillText(this.Text, 0, 0);
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
        layer: Render.Layer,
        text: string,
        callback: () => void = null
    ) {

        let root = {
            deleted: false,
            Location: new ECS.Location(750, 150)
        };
        Slide.Slide(root, 250, 150, SLIDE_SPEED);

        let message = {
            deleted: false,
            RenderText: new Text(layer, text)
        };

        Pin.Attach(root, message, 0, -1 * FONT_SIZE);

        let dismissBox = new Render.Box(-32, 0, 64, 16);
        let dismissButton = {
            deleted: false,
            RenderDebugBox: new RenderDebug.Box(
                layer,
                dismissBox,
                "#a80"
            ),
            ClickTarget: new Mouse.ClickTarget(
                Mouse.UiLayer.Textbox,
                dismissBox,
                clickedWith => Slide.Slide(root, -250, 150, SLIDE_SPEED, () => {
                    root.deleted = true;
                    message.deleted = true;
                    dismissButton.deleted = true;
                    if(callback) {
                        callback();
                    }
                })
            )
        };

        Pin.Attach(root, dismissButton, 0, -1 * FONT_SIZE);

        entities.push(root, message, dismissButton);
    };

};
