const { widget } = figma;
const { Frame, useSyncedState, usePropertyMenu, useEffect, AutoLayout, Text } = widget;

function indexWidget() {
    const [widgetStatus, setWidgetStatus] = useSyncedState("widgetStatus", "new");
    const [settingData, setSettingData] = useSyncedState("settingData", "");
    const [indexData, setIndexData] = useSyncedState("indexData", "");

    let structure;

    usePropertyMenu(
        [
            {
                itemType: "action",
                propertyName: "setting",
                tooltip: "Setting",
            },
            {
                itemType: "action",
                propertyName: "refresh",
                tooltip: "Refresh",
            },
            {
                itemType: "action",
                propertyName: "creat",
                tooltip: "Creat new Index",
            },
        ],
        ({ propertyName, propertyValue }) => {
            if (propertyName === "setting") {
                return new Promise((resolve) => {
                    figma.showUI(__html__, { width: 420, height: 668 });
                    figma.ui.postMessage(settingData);
                });
            }

            if (propertyName === "refresh") {
            }

            if (propertyName === "creat") {
            }
        }
    );

    useEffect(() => {
        figma.ui.onmessage = (msg) => {
            if (msg.type === "setting") {
                setSettingData(JSON.stringify(msg.data));
                refresh();
            }

            figma.closePlugin();
        };
    });


    // render return
    if (widgetStatus === "new") {
        structure = (
            <AutoLayout
                width={500}
                padding={{
                    vertical: 50,
                    horizontal: 0,
                }}
                cornerRadius={10}
                fill={"#fff"}
                direction={"vertical"}
                horizontalAlignItems={"center"}
                spacing={20}
                stroke={"#e0d7fb"}
                strokeWidth={1}
                effect={{ type: "drop-shadow", color: { r: 0.04, g: 0.012, b: 0.121, a: 0.1 }, offset: { x: 0, y: 4 }, blur: 48 }}
            >
                <Text fill={"#333"} fontFamily={"Gothic A1"} fontSize={20} fontWeight={800} horizontalAlignText={"center"}>
                    Create index lists!&#10;You can manage your page efficiently.
                </Text>

                <AutoLayout
                    width={300}
                    height={35}
                    cornerRadius={5}
                    fill={"#464646"}
                    horizontalAlignItems={"center"}
                    verticalAlignItems={"center"}
                    onClick={(e) => {
                        return new Promise((resolve) => {
                            figma.showUI(__html__, { width: 420, height: 668 });
                            figma.ui.postMessage(settingData);
                        });
                    }}
                >
                    <Text fill={"#fff"} fontFamily={"Gothic A1"} fontSize={14} fontWeight={700}>
                        Setting and start
                    </Text>
                </AutoLayout>
            </AutoLayout>
        );
    }

    return structure;
}

widget.register(indexWidget);
