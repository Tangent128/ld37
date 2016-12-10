/// <reference path="../src/index.ts" />

namespace Mouse {

    export enum UiLayer {
        Room = 1,
        Object = 2,
        Textbox = 3
    };

    export class ClickTarget {
        constructor(
            public layer: UiLayer,
            public bounds: Render.Box,
            public callback: (cursor: ECS.Entity) => void
        ) { };
    };
    export interface HasTarget {
        ClickTarget: ClickTarget
    };
    export function HasTarget(entity: any): entity is HasTarget {
        return entity.ClickTarget != null;
    };

    export class MouseControl {

        constructor(
            private element: HTMLElement,
            private room: ECS.Room
        ) {
            this.element.addEventListener("click", this.doClick.bind(this), false);
        };

        private doClick(event: MouseEvent) {
            let x = event.offsetX;
            let y = event.offsetY;

            let targets = this.room.Entities.filter(HasTarget) as HasTarget[];

            let topLayer = targets
                .map(entity => entity.ClickTarget.layer)
                .reduce((a, b) => Math.max(a, b), 0);

            // dispatch click to hit object(s) on top layer
            targets
                .filter(entity => entity.ClickTarget.layer == topLayer)
                .filter(entity => {
                    let box = entity.ClickTarget.bounds;

                    let relX = x, relY = y;

                    if(ECS.HasLocation(entity)) {
                        relX -= entity.Location.X;
                        relY -= entity.Location.Y;
                    }

                    return (relX >= box.x && relX < box.x + box.w)
                    && (relY >= box.y && relY < box.y + box.h);
                })
                .map(entity => {
                    entity.ClickTarget.callback(null);
                });

            // in case the callbacks deleted anything
            this.room.cleanup();
        };
    };
};
