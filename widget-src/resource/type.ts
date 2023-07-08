export interface PageItem {
    id: string;
    name: string;
    checked: boolean;
}

export interface SettingData {
    target: string;
    rule: string;
    reg: string;
    other: boolean;
    pageName: boolean;
    sectionName: boolean;
    pageList: PageItem[];
}

export interface indexItem {
    id: string;
    name: string;
    other: string;
    otherEdit: boolean;
    pageName: string;
    sectionName: string;
    status: number;
}
