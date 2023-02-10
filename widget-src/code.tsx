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
                refresh(settingData);
            }

            if (propertyName === "creat") {
            }
        }
    );

    useEffect(() => {
        figma.ui.onmessage = (msg) => {
            if (msg.type === "setting") {
                setSettingData(JSON.stringify(msg.data));
                refresh(JSON.stringify(msg.data));
            }

            if (msg.type !== "reg") {
                figma.closePlugin();
            } else {
                figma.notify("You must enter the correct regular expression grammar.", {
                    error: true,
                });
            }
        };
    });

    function refresh(rowData: string) {
        let data = JSON.parse(rowData);
        let list: (FrameNode | SectionNode)[] = [];
        let pageList = figma.root.children;
        let regexp: RegExp = new RegExp(".*");

        // make RegExp
        if (data.rule === "start") {
            regexp = new RegExp(`^${data.reg}`);
        }

        if (data.rule === "end") {
            regexp = new RegExp(`${data.reg}$`);
        }

        if (data.rule === "reg") {
            regexp = new RegExp(`${data.reg}`);
        }

        // get list
        pageList.forEach((page) => {
            page.children.forEach((child) => {
                if (data.target === "frame") {
                    if (child.type === "FRAME") {
                        list.push(child);
                    }
                }

                if (data.target === "section") {
                    if (child.type === "SECTION") {
                        list.push(child);
                    }
                }

                if (data.target === "frameinsection") {
                    if (child.type === "SECTION") {
                        child.children.forEach((progeny) => {
                            if (progeny.type === "FRAME") {
                                list.push(progeny);
                            }
                        });
                    }
                }
            });
        });

        let accordList = list.filter((item) => {
            if (data.rule === "none") {
                return item;
            } else {
                if (regexp.test(item.name) === true) {
                    return item;
                }
            }
        });

        listDataArrange(accordList);
    }

    function listDataArrange(list: (FrameNode | SectionNode)[]) {
        if (indexData === "") {
            // just add
        } else {
            // arrange
        }
        console.log(indexData);
        console.log(list);
    }

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
