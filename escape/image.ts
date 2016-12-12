/// <reference path="../src/index.ts" />

namespace RenderImage {
    export class RenderImage implements Render.Renderable {
        public Location = new ECS.Location(0, 0);

        constructor(
            public Layer: Render.Layer,
            public Image: HTMLImageElement,
            public X = 0, public Y = 0,
            public W = 32, public H = 32,
            public XOffset = 0, public YOffset = 0
        ) { };

        render(cx: CanvasRenderingContext2D) {
            this.Location.transformCx(cx);

            cx.drawImage(this.Image,
                this.X,this.Y, this.W,this.H,
                this.XOffset,this.YOffset, this.W,this.H
            );
        };
    };
    export interface HasImage {
        RenderImage: RenderImage
    };
    export function HasImage(entity: any): entity is HasImage {
        return entity.RenderImage != null;
    };

    export class RenderImageSystem extends ECS.System<HasImage> {

        constructor(
            public renderer: Render.RenderList
        ) {
            super(HasImage);
        };

        process(entity: HasImage) {
            if (ECS.HasLocation(entity)) {
                entity.RenderImage.Location = entity.Location;
            }
            this.renderer.add(entity.RenderImage);
        };

    };


    export function load(url: string): HTMLImageElement {
        let img = new Image();
        img.src = url;
        return img;
    };
};
