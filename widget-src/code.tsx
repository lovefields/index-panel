import type { SettingData, indexItem } from "./resource/type";
import { makeListStrucutre, ruleText } from "./resource/ui";
import { refresh, setPageList } from "./resource/utils";

const { widget } = figma;
const { useWidgetId, useSyncedState, usePropertyMenu, useEffect, AutoLayout, Text, Input } = widget;

function indexWidget() {
    const [widgetStatus, setWidgetStatus] = useSyncedState<string>("widgetStatus", "new");
    const [settingData, setSettingData] = useSyncedState<SettingData>("settingData", {
        target: "frame",
        rule: "none",
        reg: "",
        other: false,
        pageName: false,
        sectionName: false,
        pageList: [],
    });
    const [indexData, setIndexData] = useSyncedState<indexItem[]>("indexData", []);
    const [indexTitle, setIndexTitle] = useSyncedState<string>("indexTitle", "");
    const [indexCaption, setIndexCaption] = useSyncedState<string>("indexCaption", "");
    const [updateData, setUpdateData] = useSyncedState<string>("updateData", "");
    const [pageName, setPageName] = useSyncedState<boolean>("pageName", false);
    const [sectionName, setSectionName] = useSyncedState<boolean>("sectionName", false);
    let widgetId = useWidgetId();
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
            {
                itemType: "action",
                propertyName: "csv",
                tooltip: "Export CSV",
            },
        ],
        ({ propertyName, propertyValue }) => {
            if (propertyName === "setting") {
                setPageList(figma, settingData, setSettingData);
                return new Promise((resolve) => {
                    figma.showUI(__html__, { width: 840, height: 822 });
                    figma.ui.postMessage(settingData);
                });
            }

            if (propertyName === "refresh") {
                refresh(settingData, indexData, setPageName, setSectionName, setUpdateData, setWidgetStatus, setIndexData);
            }

            if (propertyName === "creat") {
                const thisWidgetNode = figma.getNodeById(widgetId) as WidgetNode;

                if (thisWidgetNode) {
                    let cloneWidget = thisWidgetNode.cloneWidget({
                        widgetStatus: "new",
                        settingData: {
                            target: "frame",
                            rule: "none",
                            reg: "",
                            other: false,
                            pageName: false,
                            sectionName: false,
                            pageList: [],
                        },
                        indexData: {},
                        indexTitle: "",
                        indexCaption: "",
                        updateData: "",
                    });

                    cloneWidget.x += thisWidgetNode.width + 50;
                } else {
                    figma.notify("Something wrong");
                }
            }
        }
    );

    useEffect(() => {
        figma.ui.onmessage = (msg) => {
            if (msg.type === "setting") {
                setSettingData(msg.data);
                refresh(msg.data, indexData, setPageName, setSectionName, setUpdateData, setWidgetStatus, setIndexData);
            }

            if (msg.type !== "reg") {
                figma.closePlugin();
            } else {
                figma.notify("You must enter the correct regular expression grammar.");
            }
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
                effect={{
                    type: "drop-shadow",
                    color: { r: 0.04, g: 0.012, b: 0.121, a: 0.1 },
                    offset: { x: 0, y: 4 },
                    blur: 48,
                }}
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
                            setPageList(figma, settingData, setSettingData);
                            figma.showUI(__html__, { width: 840, height: 822 });
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

    if (widgetStatus === "null") {
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
                effect={{
                    type: "drop-shadow",
                    color: { r: 0.04, g: 0.012, b: 0.121, a: 0.1 },
                    offset: { x: 0, y: 4 },
                    blur: 48,
                }}
            >
                <Text fill={"#333"} fontFamily={"Gothic A1"} fontSize={20} fontWeight={800} horizontalAlignText={"center"}>
                    Didn’t make list. Re-setting please.
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
                            setPageList(figma, settingData, setSettingData);
                            figma.showUI(__html__, { width: 840, height: 822 });
                            figma.ui.postMessage(settingData);
                        });
                    }}
                >
                    <Text fill={"#fff"} fontFamily={"Gothic A1"} fontSize={14} fontWeight={700}>
                        Setting
                    </Text>
                </AutoLayout>
            </AutoLayout>
        );
    }

    if (widgetStatus === "have") {
        structure = (
            <AutoLayout
                width={1000}
                padding={{
                    vertical: 30,
                    horizontal: 30,
                }}
                cornerRadius={10}
                fill={"#fff"}
                direction={"vertical"}
                horizontalAlignItems={"center"}
                spacing={20}
                stroke={"#e0d7fb"}
                strokeWidth={1}
                effect={{
                    type: "drop-shadow",
                    color: { r: 0.04, g: 0.012, b: 0.121, a: 0.1 },
                    offset: { x: 0, y: 4 },
                    blur: 48,
                }}
            >
                <AutoLayout width={"fill-parent"} direction={"vertical"} spacing={10}>
                    <Input
                        value={indexTitle}
                        placeholder="Index Title"
                        onTextEditEnd={(e) => {
                            setIndexTitle(e.characters);
                        }}
                        fontSize={24}
                        fontWeight={700}
                        fontFamily={"Gothic A1"}
                        width={"fill-parent"}
                        fill="#333"
                        inputBehavior="multiline"
                    />
                    <AutoLayout
                        width={"fill-parent"}
                        fill={"#FAFAFA"}
                        cornerRadius={10}
                        padding={{
                            vertical: 10,
                            horizontal: 20,
                        }}
                    >
                        <Input
                            value={indexCaption}
                            placeholder="Index Description"
                            onTextEditEnd={(e) => {
                                setIndexCaption(e.characters);
                            }}
                            fontSize={16}
                            fontFamily={"Gothic A1"}
                            width={"fill-parent"}
                            fill="#616161"
                            inputBehavior="multiline"
                        />
                    </AutoLayout>
                </AutoLayout>

                <AutoLayout width={"fill-parent"} direction={"vertical"} spacing={8}>
                    <AutoLayout width={"fill-parent"} spacing={"auto"} verticalAlignItems={"end"}>
                        <AutoLayout width={"hug-contents"} height={"hug-contents"}>
                            {ruleText(settingData)}
                        </AutoLayout>

                        <Text fill={"#949494"} fontSize={12} fontFamily={"Gothic A1"} fontWeight={500}>
                            Last update: {updateData}
                        </Text>
                    </AutoLayout>

                    {makeListStrucutre(settingData, indexData, setIndexData, pageName, sectionName)}
                </AutoLayout>
            </AutoLayout>
        );
    }

    return structure;
}

widget.register(indexWidget);
