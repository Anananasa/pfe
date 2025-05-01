export interface ActionFile {
    id: string;
    actionId: string;
    filePath: string;
    fileData: string;
    fileName: string;
    generatedFileName: string;
    virtualPath: string;
    comments: string;
    linkType: number;
    createdDate: Date;
    createdBy: string;
    updatedDate: Date;
    updatedBy: string;
    crud: number;
    crudFrom: number;
    currentUserId: string;
    currentEmployeeId: string;
    isSystem: boolean;
  }
  