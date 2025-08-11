import { promises as fs } from 'fs';
import path from 'path';

async function getFolderStructure(dirPath) {
  const structure = {
    name: path.basename(dirPath),
    type: 'directory',
    children: []
  };

  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      structure.children.push(await getFolderStructure(entryPath));
    } else if (entry.isFile()) {
      structure.children.push({
        name: entry.name,
        type: 'file'
      });
    }
  }
  return structure;
}

export async function buildProjectStructure() {
  const projectRoot = './src';
  const folderStructure = await getFolderStructure(projectRoot);
  const jsonOutput = JSON.stringify(folderStructure, null, 2);

  await fs.writeFile('./public/project-structure.json', jsonOutput);
  console.log('Project folder structure saved to project-structure.json');
}