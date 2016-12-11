namespace ECS {

    export interface Entity {
        deleted?: boolean;
    };

    export abstract class System<Type> {

        constructor(
            private filter: (item) => item is Type
        ) {};

        public run(list: Entity[]) {
            this.start();

            for(let item of list) {
                if(!item.deleted && this.filter(item)) {
                    this.process(item);
                }
            }

            this.finish();
        };

        public abstract process(item: Type);

        public start() {
            // can optionally be implemented
        };
        public finish() {
            // can optionally be implemented
        };
    };

    /**
     * A "space" containing Entities & run functions for systems 
     */
    export abstract class Room {
        lastPhysicsTick = 0;
        public Entities: Entity[] = [];

        constructor(public fps: number) {
        };

        public add(entity: any) {
            this.Entities.push(entity);
        };

        cleanup() {
            this.Entities = this.Entities.filter(entity => !entity.deleted);
        };

        public abstract runPhysics();
        public abstract runRender(cx: CanvasRenderingContext2D);
    };


    /**
     * Toplevel game/animation loop
     */
    export class Loop {

        private physicsTimeout: number = null;
        private renderTimeout: number = null;

        constructor(
            private room: Room,
            private cx: CanvasRenderingContext2D
        ) {
        };

        public start() {
            if(this.physicsTimeout == null) {
                let interval = 1000 / this.room.fps;
                this.physicsTimeout = window.setTimeout(() => {
                    this.physicsTimeout = null;
                    this.physicsTick();
                }, interval);
            }
            if(this.renderTimeout == null) {
                this.renderTimeout = window.requestAnimationFrame(() => {
                    this.renderTimeout = null;
                    this.renderTick();
                });
            }
        };

        public stop() {
            if(this.physicsTimeout != null) {
                window.clearTimeout(this.physicsTimeout);
                this.physicsTimeout = null;
            }
            if(this.renderTimeout != null) {
                window.cancelAnimationFrame(this.renderTimeout);
                this.renderTimeout = null;
            }
        };

        private physicsTick() {
            let now = (new Date()).getTime();

            this.room.runPhysics();

            this.room.lastPhysicsTick = now;

            // schedule next tick
            this.start();
        };
        private renderTick() {
            let now = (new Date()).getTime();

            this.room.runRender(this.cx);

            // schedule next tick
            this.start();
        };

    };

};
