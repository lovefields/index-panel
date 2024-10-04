import { PageItem, SettingData, indexItem } from "./type";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export async function setPageList(figma: PluginAPI, settingData: SettingData, setSettingData: Function) {
    const pageList = figma.root.children;
    const pageData: PageItem[] = [];

    pageList.forEach((page, i) => {
        const listData = settingData.pageList.find((item) => item.id === page.id);

        if (listData === undefined) {
            pageData.push({
                id: page.id,
                name: page.name,
                checked: false,
            });
        } else {
            pageData.push({
                id: page.id,
                name: page.name,
                checked: listData.checked,
            });
        }
    });

    setSettingData(
        Object.assign(settingData, {
            pageList: pageData,
        })
    );
}

export function refresh(figma: PluginAPI, rowData: SettingData, indexData: indexItem[], setPageName: Function, setSectionName: Function, setUpdateData: Function, setWidgetStatus: Function, setIndexData: Function, setSettingData: Function) {
    setPageList(figma, rowData, setSettingData);
    const data = rowData;
    const list: any[] = [];
    const pageSelected = data.pageList.filter((page) => page.checked === true);
    let pageList: any = [];
    let childList: any[] = [];
    let typeName: string = "";
    let regexp: RegExp = new RegExp(".*");

    if (pageSelected.length > 0) {
        pageList = [];

        pageSelected.forEach((selectPage) => {
            pageList.push(figma.root.children.find((page) => page.id === selectPage.id));
        });
    } else {
        pageList = figma.root.children;
    }

    setPageName(data.pageName);
    setSectionName(data.sectionName);

    // 정규식 설정
    if (data.rule === "start") {
        regexp = new RegExp(`^${data.reg}`);
    }

    if (data.rule === "end") {
        regexp = new RegExp(`${data.reg}$`);
    }

    if (data.rule === "reg") {
        regexp = new RegExp(`${data.reg}`);
    }

    pageList.forEach((page: PageNode) => {
        childList = childList.concat(page.children);
    });

    if (data.target === "frameinsection") {
        typeName = "SECTION";
    } else {
        typeName = data.target.toUpperCase();
    }

    childList = childList.filter((item) => item.type === typeName);

    if (data.target === "frameinsection") {
        childList.forEach((section) => {
            const targetChild = section.children.filter((row: any) => row.type === "FRAME");

            targetChild.forEach((target: any) => {
                list.push({
                    id: target.id,
                    sectionName: section.name,
                    name: target.name,
                    type: target.type,
                    parent: target.parent,
                });
            });
        });
    } else {
        childList.forEach((target) => {
            list.push({
                id: target.id,
                sectionName: "",
                name: target.name,
                type: target.type,
                parent: target.parent,
            });
        });
    }

    const accordList = list.filter((item) => {
        if (data.rule === "none") {
            return item;
        } else {
            if (regexp.test(item.name) === true) {
                return item;
            }
        }
    });

    listDataArrange(figma, accordList, indexData, setWidgetStatus, setIndexData, rowData);
    setUpdateData(getToday());
}

export function listDataArrange(figma: PluginAPI, list: any[], indexData: indexItem[], setWidgetStatus: Function, setIndexData: Function, settingData: SettingData) {
    if (list.length !== 0) {
        let data: indexItem[] = [];

        if (indexData.length === 0) {
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

                data.push({
                    id: item.id,
                    name: item.name,
                    sectionName: item.sectionName,
                    pageName: pageName,
                    status: 0,
                    other: "",
                    otherEdit: true,
                });
            });

            setIndexData(data);
            setWidgetStatus("have");
        } else {
            // arrange
            const newIndexData: indexItem[] = indexData.filter((item) => list.find((row) => item.id === row.id));

            list.forEach((row) => {
                let hasItem = false;
                let count = 0;
                let data: indexItem = {
                    id: "",
                    name: "",
                    sectionName: "",
                    pageName: "",
                    status: 0,
                    other: "",
                    otherEdit: true,
                };
                let pageName = "";

                newIndexData.forEach((item, i) => {
                    if (row.id === item.id) {
                        hasItem = true;
                        count = i;
                        data = {
                            ...item,
                            name: row.name,
                        };
                    }
                });

                if (row.parent !== null) {
                    if (row.parent.type === "PAGE") {
                        pageName = row.parent.name;
                    } else {
                        if (row.parent.parent !== null) {
                            if (row.parent.parent.type === "PAGE") {
                                pageName = row.parent.parent.name;
                            } else {
                                pageName = "";
                            }
                        }
                    }
                }

                // @ts-ignore : IDE가 인식못함
                if (hasItem === true) {
                    newIndexData[count] = {
                        id: data.id,
                        name: data.name,
                        sectionName: data.sectionName,
                        pageName: pageName,
                        status: data.status,
                        other: data.other,
                        otherEdit: data.otherEdit,
                    };
                } else {
                    newIndexData.push({
                        id: row.id,
                        name: row.name,
                        sectionName: row.sectionName,
                        pageName: pageName,
                        status: 0,
                        other: "",
                        otherEdit: true,
                    });
                }
            });

            const newData: indexItem[] = [];
            const promiseList: Promise<boolean>[] = [];

            newIndexData.forEach(async (item) => {
                promiseList.push(
                    new Promise(async (resolv) => {
                        const object = await figma.getNodeByIdAsync(item.id);
                        let targetType = settingData.target;

                        if (object !== null) {
                            if (targetType === "frameinsection") {
                                targetType = "FRAME";

                                if (targetType === object.type && item.sectionName !== "") {
                                    newData.push(item);
                                }
                            } else {
                                targetType = targetType.toUpperCase();

                                if (targetType === object.type && item.sectionName === "") {
                                    newData.push(item);
                                }
                            }

                            resolv(true);
                        }
                    })
                );
            });

            Promise.all(promiseList).then(() => {
                data = newData;
                setIndexData(data);
                setWidgetStatus("have");
            });
        }
    } else {
        setWidgetStatus("null");
    }
}

function getToday() {
    return dayjs().utc().format("YYYY.MM.DD HH:mm (UTC)");
}
