/// <reference path="../src/index.ts" />
/// <reference path="./mouse.ts" />
/// <reference path="./gui-room.ts" />
/// <reference path="./scenario.ts" />


@Applet.Bind("canvas")
class EscapeMain {

    private room = new GuiRoom(30, new GameState());

    private loop: ECS.Loop;

    constructor(private element: HTMLCanvasElement) {

        let cx = element.getContext("2d");

        // init entities
        ResetGame(this.room);

        // init mouse system
        new Mouse.MouseControl(this.element, this.room);

        // start loop
        this.loop = new ECS.Loop(this.room, cx);
        this.loop.start();
    };

};
