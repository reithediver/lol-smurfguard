"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const loggerService_1 = __importDefault(require("./loggerService"));
/**
 * Server-side file-based storage implementation
 */
class FileStorageAdapter {
    constructor(storagePath = 'storage') {
        this.data = {};
        this.initialized = false;
        this.storagePath = path_1.default.resolve(process.cwd(), storagePath);
        this.loadFromDisk();
    }
    loadFromDisk() {
        try {
            // Create storage directory if it doesn't exist
            if (!fs_1.default.existsSync(this.storagePath)) {
                fs_1.default.mkdirSync(this.storagePath, { recursive: true });
            }
            const filePath = path_1.default.join(this.storagePath, 'storage.json');
            if (fs_1.default.existsSync(filePath)) {
                const fileContent = fs_1.default.readFileSync(filePath, 'utf-8');
                this.data = JSON.parse(fileContent);
            }
            this.initialized = true;
        }
        catch (error) {
            loggerService_1.default.error('Error loading storage from disk:', error);
            this.data = {};
            this.initialized = true;
        }
    }
    saveToDisk() {
        try {
            const filePath = path_1.default.join(this.storagePath, 'storage.json');
            fs_1.default.writeFileSync(filePath, JSON.stringify(this.data, null, 2), 'utf-8');
        }
        catch (error) {
            loggerService_1.default.error('Error saving storage to disk:', error);
        }
    }
    getItem(key) {
        if (!this.initialized)
            this.loadFromDisk();
        return this.data[key] || null;
    }
    setItem(key, value) {
        if (!this.initialized)
            this.loadFromDisk();
        this.data[key] = value;
        this.saveToDisk();
    }
    removeItem(key) {
        if (!this.initialized)
            this.loadFromDisk();
        delete this.data[key];
        this.saveToDisk();
    }
    clear() {
        this.data = {};
        this.saveToDisk();
    }
}
// Since we're primarily running in Node.js for now,
// we'll just use the FileStorageAdapter
// When we add the frontend, we can implement a proper browser adapter
// Export a singleton instance
exports.storage = new FileStorageAdapter();
