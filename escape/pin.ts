/// <reference path="../src/index.ts" />

/**
 * Utilities for establishing an object's location relative to a parent
 */
namespace Pin {

    export class PinTo {
        constructor(
            public Parent: ECS.HasLocation,
            public X = 0,
            public Y = 0
        ) {};
    };
    export interface HasPin extends ECS.HasLocation {
        PinTo: PinTo
    };
    export function HasPin(entity: any): entity is HasPin {
        return (entity.PinTo != null) && ECS.HasLocation(entity);
    };

    /**
     * Updates locations of pinned objects.
     * Make sure this runs after parent locations are set.
     */
    export class PinSystem extends ECS.System<HasPin> {

        constructor() {
            super(HasPin);
        };

        process(entity: HasPin) {
            let offset = this.calcOffset(entity);
            entity.Location.X = offset.x;
            entity.Location.Y = offset.y;
        };

        calcOffset(entity: HasPin) {
            let pin = entity.PinTo;

            let parent = pin.Parent;
            let x = parent.Location.X;
            let y = parent.Location.Y;

            if(HasPin(parent)) {
                let parentOffset = this.calcOffset(parent);
                x = parentOffset.x;
                y = parentOffset.y;
            }

            x += pin.X;
            y += pin.Y;

            return {
                x: x,
                y: y,
                rot: 0
            };
        };

    };

};
