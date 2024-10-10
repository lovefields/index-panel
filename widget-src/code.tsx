import type { SettingData, indexItem } from "./resource/type";
import { makeListStrucutre, ruleText } from "./resource/ui";
import { refresh, setPageList } from "./resource/utils";

const { widget } = figma;
const { useWidgetNodeId, useSyncedState, usePropertyMenu, useEffect, AutoLayout, Text, Input } = widget;

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
    const [propertyMenu, setPropertyMenu] = useSyncedState<WidgetPropertyMenuItem[]>("propertyMenu", [
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
            propertyName: "csv",
            tooltip: "Export CSV",
        },
    ]);
    let structure;

    usePropertyMenu(propertyMenu, async ({ propertyName, propertyValue }) => {
        await setPageList(figma, settingData, setSettingData);
        if (propertyName === "setting") {
            return new Promise((resolve) => {
                figma.showUI(__html__, { width: 840, height: 822 });
                figma.ui.postMessage(settingData);
            });
        }

        if (propertyName === "refresh") {
            refresh(figma, settingData, indexData, setPageName, setSectionName, setUpdateData, setWidgetStatus, setIndexData, setSettingData);
        }

        if (propertyName === "csv") {
            let csvData = "data:text/csv;charset=utf-8,\uFEFF";

            csvData += "No,Frame Name,Status\r\n";

            indexData.forEach((row, count) => {
                const frameName = `${pageName ? `${row.pageName} - ` : ""} ${sectionName ? `[${row.sectionName}] ` : ""}${row.name}`;
                let statusName = "Not Started";

                if (row.status === 1) {
                    statusName = "In progress";
                }

                if (row.status === 2) {
                    statusName = "Completed";
                }

                csvData += `${count + 1},${frameName},${statusName}\r\n`;
            });

            return new Promise((resolve) => {
                figma.showUI(`
                        <script>
                            window.onmessage = (event) => {
                                const data = event.data.pluginMessage;
                                const link = document.createElement("a");
                                link.href = encodeURI(data.content);
                                link.download = data.title;
                                document.body.appendChild(link);
                                link.click();

                                parent.postMessage({ pluginMessage: { type: "close" } }, "*");
                            };
                        </script>
                    `);
                figma.ui.postMessage({
                    title: indexTitle ? indexTitle : "Index Panel",
                    content: csvData,
                });
            });
        }

        if (propertyName === "donate") {
            await figma.payments?.initiateCheckoutAsync({ interstitial: "SKIP" }).then(() => {
                figma.notify("Thank You So Much!");
            });
        }
    });

    useEffect(() => {
        figma.payments?.setPaymentStatusInDevelopment({ type: "UNPAID" });

        if (figma.payments?.status.type === "UNPAID" && propertyMenu.length === 3) {
            setPropertyMenu([
                ...propertyMenu,
                {
                    itemType: "separator",
                },
                {
                    itemType: "action",
                    propertyName: "donate",
                    tooltip: "Donate",
                },
            ]);
        }

        if (figma.payments?.status.type === "PAID" && propertyMenu.length !== 3) {
            setPropertyMenu(propertyMenu.slice(0, 3));
        }

        figma.loadAllPagesAsync();
        figma.ui.onmessage = (msg) => {
            if (msg.type === "setting") {
                setSettingData(msg.data);
                refresh(figma, msg.data, indexData, setPageName, setSectionName, setUpdateData, setWidgetStatus, setIndexData, setSettingData);
                figma.closePlugin();
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
                    onClick={async (e) => {
                        await setPageList(figma, settingData, setSettingData);
                        return new Promise((resolve) => {
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
                        return new Promise(async (resolve) => {
                            await await setPageList(figma, settingData, setSettingData);
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
