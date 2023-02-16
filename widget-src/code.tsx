const { widget } = figma;
const { useWidgetId, Frame, useSyncedState, usePropertyMenu, useEffect, AutoLayout, Text, Input, SVG } = widget;

function indexWidget() {
    const [widgetStatus, setWidgetStatus] = useSyncedState("widgetStatus", "new");
    const [settingData, setSettingData] = useSyncedState("settingData", "");
    const [indexData, setIndexData] = useSyncedState("indexData", "{}");
    const [indexTitle, setIndexTitle] = useSyncedState("indexTitle", "");
    const [indexCaption, setIndexCaption] = useSyncedState("indexCaption", "");
    const [updateData, setUpdateData] = useSyncedState("updateData", "");
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
                const allNode: any[] = figma.currentPage.findAll();
                const allWidgetNodes: WidgetNode[] = allNode.filter((node) => {
                    return node.type === "WIDGET";
                });

                const myWidgetNodes: WidgetNode[] = allWidgetNodes.filter((node) => {
                    return node.widgetId === figma.widgetId;
                });

                const thisWidgetNode: WidgetNode = myWidgetNodes.filter((node) => {
                    return node.id === widgetId;
                })[0];

                let cloneWidget = thisWidgetNode.cloneWidget({
                    widgetStatus: "new",
                    settingData: "",
                    indexData: "{}",
                    indexTitle: "",
                    indexCaption: "",
                    updateData: "",
                });

                cloneWidget.x += thisWidgetNode.width + 50;
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
                figma.notify("You must enter the correct regular expression grammar.");
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
        setUpdateData(getToday());
    }

    function getToday() {
        let today: Date = new Date();
        let yyyy = today.getFullYear();
        let mm = String(today.getMonth() + 1);
        let dd = String(today.getDay());

        if (mm.length === 1) {
            mm = `0${mm}`;
        }

        if (dd.length === 1) {
            dd = `0${dd}`;
        }

        return `${yyyy}.${mm}.${dd}`;
    }

    function listDataArrange(list: (FrameNode | SectionNode)[]) {
        if (list.length !== 0) {
            let data: { [key: string]: object } = {};

            if (indexData === "{}") {
                // just add
                list.forEach((item) => {
                    let pageName;

                    if (item.parent !== null) {
                        if (item.parent.type === "PAGE") {
                            pageName = item.parent.name;
                        } else {
                            if (item.parent.parent !== null) {
                                if (item.parent.parent.type === "PAGE") {
                                    pageName = item.parent.parent.name;
                                } else {
                                    pageName = "";
                                }
                            }
                        }
                    }

                    data[item.id] = {
                        name: item.name,
                        pageName: pageName,
                        status: 0,
                        other: "",
                        otherEdit: true,
                    };
                });
            } else {
                // arrange
                let existingData = JSON.parse(indexData);
                let keyList: string[] = Object.keys(existingData);

                keyList.map((key: string) => {
                    let hasKey: boolean = false;

                    list.forEach((item: FrameNode | SectionNode) => {
                        if (item.id === key) {
                            hasKey = true;
                        }
                    });

                    if (hasKey === false) {
                        delete existingData[key];
                    }
                });

                list.forEach((item: FrameNode | SectionNode) => {
                    if (keyList.indexOf(item.id) === -1) {
                        let pageName;

                        if (item.parent !== null) {
                            if (item.parent.type === "PAGE") {
                                pageName = item.parent.name;
                            } else {
                                if (item.parent.parent !== null) {
                                    if (item.parent.parent.type === "PAGE") {
                                        pageName = item.parent.parent.name;
                                    } else {
                                        pageName = "";
                                    }
                                }
                            }
                        }

                        existingData[item.id] = {
                            name: item.name,
                            pageName: pageName,
                            status: 0,
                            other: "",
                            otherEdit: true,
                        };
                    }
                });

                data = existingData;
            }

            setIndexData(JSON.stringify(data));
            setWidgetStatus("have");
        } else {
            setWidgetStatus("null");
        }
    }

    // rule text maker
    function ruleText(option: { [key: string]: string }) {
        if (option.rule === "none") {
            return (
                <AutoLayout spacing={3}>
                    <Text fill={"#949494"} fontSize={12} fontFamily={"Gothic A1"} fontWeight={500}>
                        Rule : None
                    </Text>
                </AutoLayout>
            );
        } else {
            let target: string = option.target === "frameinsection" ? "frame" : option.target;

            return (
                <AutoLayout spacing={3} verticalAlignItems={"center"}>
                    <Text fill={"#949494"} fontSize={12} fontFamily={"Gothic A1"} fontWeight={500}>
                        Rule : {option.rule} with{" "}
                    </Text>
                    <AutoLayout
                        fill={"#f0ebfd"}
                        padding={{
                            vertical: 4,
                            horizontal: 8,
                        }}
                        cornerRadius={6}
                    >
                        <Text fill={"#6436ea"} fontSize={12} fontFamily={"Gothic A1"} fontWeight={700} textDecoration={"underline"}>
                            {option.reg}
                        </Text>
                    </AutoLayout>
                    <Text fill={"#949494"} fontSize={12} fontFamily={"Gothic A1"} fontWeight={500}>
                        at {target} name
                    </Text>
                </AutoLayout>
            );
        }
    }

    // list structure maker
    function makeListStrucutre(option: { [key: string]: string | boolean }) {
        const arrowRight = `<svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.64557 3.89733C6.84034 3.70158 7.15693 3.70079 7.35267 3.89557L11.6677 8.18916C11.762 8.283 11.815 8.41055 11.815 8.54359C11.815 8.67663 11.762 8.80418 11.6677 8.89802L7.35267 13.1916C7.15693 13.3864 6.84034 13.3856 6.64557 13.1899C6.45079 12.9941 6.45158 12.6775 6.64733 12.4828L10.6061 8.54359L6.64733 4.60443C6.45158 4.40966 6.45079 4.09307 6.64557 3.89733Z" fill="#333"/></svg>`;
        const pencli = `<svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M13.5558 4.51626C13.6399 4.43208 13.7746 4.43208 13.8587 4.51626L14.9933 5.65082L14.9986 5.6561C15.0812 5.73663 15.0893 5.86982 14.998 5.96532L13.9787 6.98457L12.5331 5.53893L13.5558 4.51626ZM14.6984 3.67657C14.1505 3.12864 13.264 3.12864 12.7161 3.67657L11.2736 5.11908C11.2538 5.13888 11.2357 5.15972 11.2192 5.18144L3.93976 12.453C3.82827 12.5643 3.76562 12.7155 3.76562 12.873V15.1584C3.76562 15.4863 4.03146 15.7521 4.35938 15.7521H6.6447C6.80218 15.7521 6.9532 15.6896 7.06455 15.5782L14.4878 8.15496C14.4899 8.15292 14.4919 8.15087 14.4939 8.14881L15.8411 6.8016L15.8464 6.79625C16.3843 6.24455 16.3928 5.36005 15.8307 4.80881L14.6984 3.67657ZM13.1391 7.8243L11.6972 6.38244L4.95312 13.1192V14.5646H6.39876L13.1391 7.8243Z" fill="#6436EA"/></svg>`;
        let listData = JSON.parse(indexData);
        let keyList: string[] = Object.keys(listData);
        let count: number = 1;
        let list = keyList.map((key: string) => {
            let row = listData[key];
            const linkIcon = `<svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.16855 9.86004L5.17054 9.85657L5.30581 9.62227C5.44388 9.38313 5.36194 9.07733 5.12279 8.93926C4.88365 8.80119 4.57785 8.88313 4.43978 9.12227L4.3025 9.36004L4.30033 9.36385C3.48168 10.7865 3.968 12.5975 5.38998 13.4185C6.81322 14.2402 8.6267 13.7543 9.44841 12.331L9.45229 12.3242L9.45306 12.3228L10.1281 11.1537C10.1304 11.1499 10.1327 11.146 10.1349 11.1422C10.8797 9.85208 10.438 8.20362 9.14794 7.45878C8.90879 7.32071 8.603 7.40265 8.46493 7.64179C8.32686 7.88094 8.40879 8.18674 8.64794 8.32481C9.45636 8.79155 9.73525 9.82176 9.27468 10.632C9.27364 10.6337 9.27261 10.6355 9.27159 10.6372C9.27061 10.6388 9.26964 10.6405 9.26867 10.6422L8.58229 11.831L8.57814 11.8384C8.0306 12.7776 6.83248 13.0966 5.88998 12.5525C4.94503 12.0069 4.62298 10.805 5.16855 9.86004ZM6.08722 6.26903C6.08567 6.27171 6.08414 6.27441 6.08265 6.27711C5.3443 7.566 5.78685 9.20915 7.07425 9.95244C7.3134 10.0905 7.61919 10.0086 7.75726 9.76942C7.89533 9.53028 7.8134 9.22448 7.57425 9.08641C6.76245 8.61772 6.48462 7.58084 6.95331 6.76905L6.95744 6.76175L7.63768 5.58355L7.63964 5.58018C8.18521 4.63523 9.38711 4.31318 10.3321 4.85875C11.2742 5.4027 11.5971 6.5991 11.0583 7.54276C11.0573 7.54445 11.0563 7.54615 11.0553 7.54786C11.0546 7.54895 11.054 7.55005 11.0534 7.55116L10.9161 7.78893C10.778 8.02808 10.8599 8.33387 11.0991 8.47194C11.3382 8.61001 11.644 8.52808 11.7821 8.28893L11.914 8.06054L11.9153 8.05825L11.9195 8.05116C12.7412 6.62792 12.2553 4.81443 10.8321 3.99272C9.41004 3.17172 7.59847 3.65609 6.77575 5.07648L6.7736 5.08018L6.08722 6.26903Z" fill="${
                row.other === "" ? "#949494" : "#333"
            }"/></svg>`;
            let statusData = {
                bg: "#fff3f3",
                text: "#e84e4e",
                content: "Not Started",
            };

            if (row.status == 1) {
                statusData = {
                    bg: "#F4FFF8",
                    text: "#38c66b",
                    content: "In progress",
                };
            }

            if (row.status == 2) {
                statusData = {
                    bg: "#F5F8FF",
                    text: "#5176f8",
                    content: "Completed",
                };
            }

            let otherLinkStructure;

            if (row.otherEdit === true) {
                otherLinkStructure = (
                    <AutoLayout padding={10} width={180} height={"fill-parent"} horizontalAlignItems={"center"} verticalAlignItems={"center"}>
                        <SVG src={linkIcon}></SVG>
                        <Input
                            value={row.other}
                            placeholder="-"
                            onTextEditEnd={(e) => {
                                if (e.characters !== "") {
                                    let urlRegex =
                                        "^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$";
                                    let url = new RegExp(urlRegex, "i");

                                    if (url.test(e.characters) === true) {
                                        listData[key].other = e.characters;
                                        listData[key].otherEdit = false;
                                        setIndexData(JSON.stringify(listData));
                                    } else {
                                        figma.notify("You must enter only text that is available as a link.");
                                    }
                                }
                            }}
                            fontSize={12}
                            fontWeight={500}
                            fontFamily={"Gothic A1"}
                            width={"fill-parent"}
                            fill="#333"
                        />
                    </AutoLayout>
                );
            } else {
                otherLinkStructure = (
                    <AutoLayout padding={10} width={180} height={"fill-parent"} horizontalAlignItems={"center"} verticalAlignItems={"center"}>
                        <Text href={row.other} fontSize={12} fontWeight={500} fontFamily={"Gothic A1"} width={"fill-parent"} fill="#333">
                            {row.other === "" ? row.other : row.other.substr(0, 20) + "..."}
                        </Text>
                        <SVG
                            src={pencli}
                            onClick={(e) => {
                                listData[key].otherEdit = true;
                                setIndexData(JSON.stringify(listData));
                            }}
                        ></SVG>
                    </AutoLayout>
                );
            }

            let structure = (
                <AutoLayout key={key} width={"fill-parent"} stroke={"#e0e0e0"} strokeWidth={1} strokeAlign={"center"} strokeDashPattern={[2, 2]}>
                    <AutoLayout width={100} padding={10} height={"fill-parent"} fill={"#F9F6FF"} horizontalAlignItems={"center"} verticalAlignItems={"center"}>
                        <Text fill={"#333"} fontSize={16} fontFamily={"Gothic A1"} fontWeight={700}>
                            {count}
                        </Text>
                    </AutoLayout>

                    <AutoLayout padding={10} width={"fill-parent"} height={"fill-parent"} horizontalAlignItems={"center"} verticalAlignItems={"center"}>
                        <Text width={"fill-parent"} fill={"#333"} fontSize={16} fontFamily={"Gothic A1"} fontWeight={500}>{`${row.pageName} - ${row.name}`}</Text>
                    </AutoLayout>

                    <AutoLayout
                        width={180}
                        padding={10}
                        height={"fill-parent"}
                        horizontalAlignItems={"center"}
                        verticalAlignItems={"center"}
                        onClick={(e) => {
                            const allNode: any[] = figma.root.findAll();
                            const target: any = allNode.filter((node) => {
                                return node.id === key;
                            });
                            let pageNode = target[0].parent;

                            if (pageNode.type == "SECTION") {
                                pageNode = pageNode.parent;
                            }

                            figma.currentPage = pageNode;
                            figma.viewport.scrollAndZoomIntoView(target);
                        }}
                    >
                        <Text fill={"#333"} fontSize={16} fontFamily={"Gothic A1"} fontWeight={700} textDecoration={"underline"}>
                            Go to frame
                        </Text>
                        <SVG src={arrowRight}></SVG>
                    </AutoLayout>

                    {option.other === true ? otherLinkStructure : null}

                    <AutoLayout width={180} padding={10} height={"fill-parent"} horizontalAlignItems={"center"} verticalAlignItems={"center"}>
                        <AutoLayout
                            fill={statusData.bg}
                            padding={{
                                vertical: 6,
                                horizontal: 12,
                            }}
                            cornerRadius={5}
                            onClick={(e) => {
                                if (listData[key].status >= 2) {
                                    listData[key].status = 0;
                                } else {
                                    listData[key].status += 1;
                                }
                                setIndexData(JSON.stringify(listData));
                            }}
                        >
                            <Text fill={statusData.text} fontSize={12} fontWeight={700} fontFamily={"Gothic A1"}>
                                {statusData.content}
                            </Text>
                        </AutoLayout>
                    </AutoLayout>
                </AutoLayout>
            );

            count += 1;

            return structure;
        });

        return (
            <AutoLayout name="list-wrap" width={"fill-parent"} stroke={"#f1f1f1"} strokeWidth={1} cornerRadius={10} direction={"vertical"}>
                <AutoLayout name="head" width={"fill-parent"} height={41} stroke={"#e0e0e0"} strokeWidth={1} strokeAlign={"center"}>
                    <AutoLayout width={100} height={"fill-parent"} fill={"#F9F6FF"} horizontalAlignItems={"center"} verticalAlignItems={"center"}>
                        <Text fill={"#333"} fontSize={14} fontFamily={"Gothic A1"} fontWeight={700}>
                            No.
                        </Text>
                    </AutoLayout>

                    <AutoLayout width={"fill-parent"} height={"fill-parent"} fill={"#fafafa"} horizontalAlignItems={"center"} verticalAlignItems={"center"}>
                        <Text fill={"#333"} fontSize={14} fontFamily={"Gothic A1"} fontWeight={700}>
                            Frame Name
                        </Text>
                    </AutoLayout>

                    <AutoLayout width={180} height={"fill-parent"} fill={"#fafafa"} horizontalAlignItems={"center"} verticalAlignItems={"center"}>
                        <Text fill={"#333"} fontSize={14} fontFamily={"Gothic A1"} fontWeight={700}>
                            Frame Link
                        </Text>
                    </AutoLayout>

                    {option.other === true ? (
                        <AutoLayout width={180} height={"fill-parent"} fill={"#fafafa"} horizontalAlignItems={"center"} verticalAlignItems={"center"}>
                            <Text fill={"#333"} fontSize={14} fontFamily={"Gothic A1"} fontWeight={700}>
                                Other Link
                            </Text>
                        </AutoLayout>
                    ) : null}

                    <AutoLayout width={180} height={"fill-parent"} fill={"#fafafa"} horizontalAlignItems={"center"} verticalAlignItems={"center"}>
                        <Text fill={"#333"} fontSize={14} fontFamily={"Gothic A1"} fontWeight={700}>
                            Status
                        </Text>
                    </AutoLayout>
                </AutoLayout>

                {list}
            </AutoLayout>
        );
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
                effect={{ type: "drop-shadow", color: { r: 0.04, g: 0.012, b: 0.121, a: 0.1 }, offset: { x: 0, y: 4 }, blur: 48 }}
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
                            figma.showUI(__html__, { width: 420, height: 668 });
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
        let optionData = JSON.parse(settingData);

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
                effect={{ type: "drop-shadow", color: { r: 0.04, g: 0.012, b: 0.121, a: 0.1 }, offset: { x: 0, y: 4 }, blur: 48 }}
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
                            {ruleText(optionData)}
                        </AutoLayout>

                        <Text fill={"#949494"} fontSize={12} fontFamily={"Gothic A1"} fontWeight={500}>
                            Last update: {updateData}
                        </Text>
                    </AutoLayout>

                    {makeListStrucutre(optionData)}
                </AutoLayout>
            </AutoLayout>
        );
    }

    return structure;
}

widget.register(indexWidget);
