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
            public callback: (cursor: ECS.Entity & IsCursor) => void
        ) { };
    };
    export interface HasTarget {
        ClickTarget: ClickTarget
    };
    export function HasTarget(entity: any): entity is HasTarget {
        return entity.ClickTarget != null;
    };

    export interface IsCursor extends ECS.HasLocation {
        IsCursor: true
    };
    export function IsCursor(entity: any): entity is IsCursor {
        return (entity.IsCursor == true) && ECS.HasLocation(entity);
    };

    export function MakeCursor(entity: any) {
        entity.IsCursor = true;
    };
    export function CancelCursor(entity: any) {
        entity.IsCursor = false;
    };

    export class MouseControl {

        private x = 0;
        private y = 0;

        constructor(
            private element: HTMLElement,
            private room: ECS.Room
        ) {
            this.element.addEventListener("click", this.doClick.bind(this), false);
            this.element.addEventListener("mousemove", this.doMove.bind(this), false);
        };

        private doClick(event: MouseEvent) {
            let x = event.offsetX;
            let y = event.offsetY;

            let targets = this.room.Entities.filter(entity => {
                return HasTarget(entity) && ! IsCursor(entity)
            }) as HasTarget[];

            let topLayer = targets
                .map(entity => entity.ClickTarget.layer)
                .reduce((a, b) => Math.max(a, b), 0);

            // search for cursor objects
            let cursors = this.room.Entities.filter(IsCursor) as IsCursor[];

            // dispatch click to hit object(s) on top layer (or not bound to a layer)
            targets
                .filter(entity => entity.ClickTarget.layer == topLayer
                    || entity.ClickTarget.layer == null)
                .filter(entity => {
                    let box = entity.ClickTarget.bounds;

                    let relX = x, relY = y;

                    if (ECS.HasLocation(entity)) {
                        relX -= entity.Location.X;
                        relY -= entity.Location.Y;
                    }

                    return (relX >= box.x && relX < box.x + box.w)
                        && (relY >= box.y && relY < box.y + box.h);
                })
                .map(entity => {
                    entity.ClickTarget.callback(cursors[0] || null);
                });

            // in case the callbacks deleted anything
            this.room.cleanup();
        };

        private doMove(event: MouseEvent) {
            this.x = event.offsetX;
            this.y = event.offsetY;

            // search for cursor objects
            let cursors = this.room.Entities.filter(IsCursor) as IsCursor[];

            cursors.map(entity => {
                entity.Location.X = this.x;
                entity.Location.Y = this.y;
            });
        };
    };
};
