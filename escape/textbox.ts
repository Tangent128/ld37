/// <reference path="../src/index.ts" />

namespace Textbox {

    export class Text implements Render.Renderable {
        public Location = new ECS.Location(0, 0);

        constructor(
            public Layer: Render.Layer,
            public Text: string
        ) { };

        render(cx: CanvasRenderingContext2D) {
            cx.fillStyle = "#fff";
            cx.font = "16px Roboto, sans-serif";
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
            if(ECS.HasLocation(entity)) {
                entity.RenderText.Location = entity.Location;
            }
            this.renderer.add(entity.RenderText);
        };

    };

};
