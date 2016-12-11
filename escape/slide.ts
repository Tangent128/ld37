/// <reference path="../src/index.ts" />

namespace Slide {

    export class SlideBehavior {
        constructor(
            public TargetX = 0,
            public TargetY = 0,
            public Speed = 10,
            public Callback = () => {}
        ) {};
    };
    export interface HasSlideBehavior extends ECS.HasLocation {
        Location: ECS.Location,
        SlideBehavior: SlideBehavior
    };
    export function HasSlideBehavior(entity: any): entity is HasSlideBehavior {
        return (entity.SlideBehavior != null) && ECS.HasLocation(entity);
    };

    /**
     * Slides an object to the left.
     */
    export class SlideSystem extends ECS.System<HasSlideBehavior> {

        constructor() {
            super(HasSlideBehavior);
        };

        process(entity: HasSlideBehavior) {
            if(entity.Location.X > entity.SlideBehavior.TargetX) {
                entity.Location.X -= entity.SlideBehavior.Speed;
            }
            if(entity.Location.X <= entity.SlideBehavior.TargetX) {
                entity.Location.X = entity.SlideBehavior.TargetX;

                // trigger finish callback
                let callback = entity.SlideBehavior.Callback;
                entity.SlideBehavior = null;
                callback();
            }
        };

    };

    export function Slide(
        entity: ECS.HasLocation,
        x: number, y: number,
        speed: number,
        callback = () => {}
    ) {
        let slideBehavior = new SlideBehavior(x, y, speed, callback);
        (entity as any as HasSlideBehavior).SlideBehavior = slideBehavior;
    };

};
