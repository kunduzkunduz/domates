import { openDB, IDBPDatabase } from 'idb';
import { Project } from './types';

const DB_NAME = 'BDD-WEB-DB';
const DB_VERSION = 1;
const PROJECTS_STORE = 'projects';

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDb = (): Promise<IDBPDatabase> => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
          db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

// C(R)UD operations for projects
export const getProjects = async (): Promise<Project[]> => {
  const db = await getDb();
  return db.getAll(PROJECTS_STORE);
};

export const getProjectById = async (id: string): Promise<Project | undefined> => {
  const db = await getDb();
  return db.get(PROJECTS_STORE, id);
};

export const saveProject = async (project: Project): Promise<void> => {
  const db = await getDb();
  await db.put(PROJECTS_STORE, project);
};

export const deleteProject = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.delete(PROJECTS_STORE, id);
};