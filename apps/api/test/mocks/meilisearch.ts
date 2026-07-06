export const mockSearchIndex = {
  updateSettings: jest.fn().mockResolvedValue({}),
  addDocuments: jest.fn().mockResolvedValue({}),
  deleteDocument: jest.fn().mockResolvedValue({}),
  search: jest.fn().mockResolvedValue({ hits: [] }),
  deleteAllDocuments: jest.fn().mockResolvedValue({}),
};

export class Meilisearch {
  constructor() {}
  index() {
    return mockSearchIndex;
  }
}
export class Index {}
