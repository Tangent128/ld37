/// <reference path="../src/index.ts" />
/// <reference path="./slide.ts" />
/// <reference path="./gui-room.ts" />

function ResetGame(room: GuiRoom) {

    room.Entities.length = 0;

    let toggle1 = room.makeDummyObject("#0f0", 300, 70, "Test Text");
    room.onClick(toggle1, clickedWith => {
        if (toggle1.RenderDebugBox.color == "#0f0") {
            toggle1.RenderDebugBox.color = "#ff0";
        } else {
            toggle1.RenderDebugBox.color = "#0f0";
        }
    });

    let toggle2 = room.makeDummyObject("#00f", 200, 250, "Test\nMultiline\nText");
    room.onClick(toggle2, clickedWith => {
        if (toggle2.RenderDebugBox.color == "#00f") {
            toggle2.RenderDebugBox.color = "#08f";
        } else {
            toggle2.RenderDebugBox.color = "#00f";
        }
    });

    let triggerBox = room.makeDummyObject("#000", 0, 0, "Trigger");
    room.onClick(triggerBox, clickedWith => {
        room.showMessageBox("MessageBox Text");
    });

    let slideBox = room.makeDummyObject("#0a6", 525, 150, "Slide");
    let slideBehavior = new Slide.SlideBehavior(150, 150);
    (slideBox as any as Slide.HasSlideBehavior).SlideBehavior = slideBehavior;

    room.addDropTarget(new ECS.Location(200, 200));
    room.addDropTarget(new ECS.Location(300, 120));
};
