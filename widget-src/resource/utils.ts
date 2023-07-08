import { PageItem, SettingData, indexItem } from "./type";

export function setPageList(figma: PluginAPI, settingData: SettingData, setSettingData: Function) {
    const pageList = figma.root.children;
    const pageData: PageItem[] = [];

    if (settingData.pageList.length === 0) {
        pageList.forEach((page: PageNode) => {
            pageData.push({
                id: page.id,
                name: page.name,
                checked: false,
            });
        });
    } else {
        const preData = settingData;

        preData.pageList.forEach((item) => {
            pageList.forEach((page) => {
                if (item.id === page.id) {
                    pageData.push(item);
                }
            });
        });

        pageList.forEach((page) => {
            const hasList = preData.pageList.filter((item) => item.id === page.id);

            if (hasList.length === 0) {
                pageData.push({
                    id: page.id,
                    name: page.name,
                    checked: false,
                });
            }
        });
    }

    setSettingData(
        Object.assign(settingData, {
            pageList: pageData,
        })
    );
}

export function refresh(rowData: SettingData, indexData: indexItem[], setPageName: Function, setSectionName: Function, setUpdateData: Function, setWidgetStatus: Function, setIndexData: Function) {
    const data = rowData;
    const list: any[] = [];
    const pageSelected = data.pageList.filter((page) => page.checked === true);
    let pageList: any = [];
    let childList: any[] = [];
    let typeName: string = "";
    let regexp: RegExp = new RegExp(".*");

    if (pageSelected.length > 0) {
        pageList = [];

        pageSelected.forEach((data) => {
            pageList.push(figma.getNodeById(data.id));
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

    listDataArrange(accordList, indexData, setWidgetStatus, setIndexData);
    setUpdateData(getToday());
}

export function listDataArrange(list: any[], indexData: indexItem[], setWidgetStatus: Function, setIndexData: Function) {
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
        } else {
            // arrange
            indexData.forEach((row, count) => {
                const haveItem = list.filter((item) => item.id === row.id);

                if (haveItem.length === 0) {
                    indexData.splice(count, 1);
                }
            });

            list.forEach((row) => {
                let hasItem = false;
                let count = 0;
                let data;
                let pageName;

                indexData.forEach((item, i) => {
                    if (row.id === item.id) {
                        hasItem = true;
                        count = i;
                        data = item;
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

                if (hasItem === true) {
                    indexData[count] = {
                        id: data.id,
                        name: data.name,
                        sectionName: data.sectionName,
                        pageName: pageName,
                        status: 0,
                        other: "",
                        otherEdit: true,
                    };
                } else {
                    indexData.push({
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

            data = indexData;
        }

        setIndexData(data);
        setWidgetStatus("have");
    } else {
        setWidgetStatus("null");
    }
}

function getToday() {
    const today: Date = new Date();
    const yyyy = today.getFullYear();
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
