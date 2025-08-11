import structure from "../public/project-structure.json"

const fragment = document.createElement("div");
fragment.innerHTML = `
  <button id="open-menu-btn" class="open-menu-btn">menu</button>
  
  <div id="menu-modal" class="modal-overlay hidden">
    <div class="modal-content">
      <div class="modal-header">
      <h2>Experiment Repository</h2>
      <button id="close-menu-btn" class="close-menu-btn">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
    
    <div id="menu-content" class="menu-content"></div>
  </div>
`
document.body.appendChild(fragment);


const openBtn = document.getElementById('open-menu-btn');
const closeBtn = document.getElementById('close-menu-btn');
const modal = document.getElementById('menu-modal');
const menuContent = document.getElementById('menu-content');

function buildFileTree(node, parentElement, path = '') {
  const itemPath = path ? `${path}${node.name == 'src' ? '' : `${node.name}/`}` : node.name;

  // Add name
  if (node.type === 'directory') {

    // Create a container for the current item
    const itemDiv = document.createElement('div');
    itemDiv.className = `menu-item ${node.type}`;

    // Add icon
    const icon = document.createElement('span');
    icon.className = 'icon';
    icon.innerHTML = node.type === 'directory'
      ? '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>'
      : '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0015.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>';

    const element = document.createElement('a');
    element.textContent = node.name;
    element.className = 'name';
    element.href = itemPath


    itemDiv.appendChild(icon);
    itemDiv.appendChild(element);

    parentElement.appendChild(itemDiv);
  }

  // If it's a directory and has children, recurse
  if (node.type === 'directory' && node.children && node.children.length > 0) {
    const hasDirectory = node.children.reduce((acc, child) => { if(child.type == "directory") return true }, false)
    if(hasDirectory) {
      const childrenDiv = document.createElement('div');
      childrenDiv.className = 'directory-children';
      node.children.forEach(child => {
        buildFileTree(child, childrenDiv, itemPath);
      });
      parentElement.appendChild(childrenDiv);
    }
  }
}

// Initial rendering of the tree
buildFileTree(structure, menuContent, '/');

// Event listeners for showing/hiding the modal
openBtn.addEventListener('click', () => {
  modal.classList.remove('hidden');
});

closeBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
});