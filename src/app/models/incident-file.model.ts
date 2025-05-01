import { v4 as uuidv4 } from 'uuid';

export class incidentFile {
  incidentId?: string = uuidv4();
  comments: string = '';
  linkType: number = 0;
  filePath: string = '';
  fileData: string = '';
  generatedFileName: string = '';
  virtualPath: string = '';
  fileName: string = '';
  createdDate: Date = new Date();
  createdBy: string = uuidv4();
  updatedDate: Date = new Date();
  updatedBy: string = uuidv4();
  crudFrom: number = 0;
  id: string = uuidv4();
  currentUserId: string = uuidv4();
  currentEmployeeId: string = uuidv4();
  isSystem: boolean = false;
  crud: number = 0;

  constructor(data?: Partial<incidentFile>) {
    if (data) {
      Object.assign(this, data);
    }
  }
}
