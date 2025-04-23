import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { gsap } from "gsap";
//import * as functions from './functions.js';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Group, TextureLoader } from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry';


document.addEventListener('DOMContentLoaded', function() {

  //setup
  const scene = new THREE.Scene();


  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 25;
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth - 18, window.innerHeight - 18);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);


  const ambientLight = new THREE.AmbientLight(0xffffff, 2); // Higher intensity for brighter illumination
  scene.add(ambientLight);
  
  // Optionally, add hemisphere light for subtle shading
  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2); // Sky and ground light
  scene.add(hemisphereLight);
  // scene.background.set 


  //Variables

  const boxSize = 5;
  let targetPosition = new THREE.Vector3();
  let currentLookAt = new THREE.Vector3(0, 0, 0);  // Camera focus point
  const boxes = [];
  let hoveredCube = null;
  let structure = 0;
  let relations = 1;
  let explore = true;
  let statusList = [[]];
  let boundings = [];
  let clickedCube = null;




    let mode = structure;
    let currentGroup = null;

    //buttons
    const reverseButton = document.getElementById('reverseButton');
    const exploreButton = document.getElementById('explore');
    const structureButton = document.getElementById("structure");
    const relationsButton = document.getElementById("relations");
    const clickedCubeInfoContainer = document.getElementById('clicked-cube-info');


    const white = 0xFFFFFF; 
    const red = 0xfb958b;
    const blue = 0x7bb3ff;
    const green = 0x65c3ba;
    const black = 0x000000;


  

// bigCube
  const bigCubeSize = 150; // Size of the big cube
  const bigCubeGeometry = new THREE.BoxGeometry(bigCubeSize, bigCubeSize, bigCubeSize);
  const bigCubeMaterial = new THREE.MeshBasicMaterial({ color: 0x555555, wireframe: true, transparent: true, opacity: 0 });
  const bigCube = new THREE.Mesh(bigCubeGeometry, bigCubeMaterial);
  scene.add(bigCube);  





//createBoxes
function createBox(name, description, status, image) {

let colour = white;

if(image == false){
  if(status == "theories"){colour = red}
  else if(status == "prototype"){colour = blue}
  else if(status == "results"){colour = green}
}else{colour = white}





   const geometry = new THREE.BoxGeometry(boxSize, boxSize, 5);
   const material = new THREE.MeshStandardMaterial({ color: colour, transparent: true,opacity: 1, wireframe: true });
   const cube = new THREE.Mesh(geometry, material);


  // scene.background = new THREE.Color(0x373854);

  cube.userData.group = null;


  cube.userData.children = [];
  cube.userData.parents = [];
  cube.userData.name = name;
  cube.userData.description = description;
  cube.userData.status = status;
  cube.userData.relations=[]
  cube.userData.level = 0;
  cube.userData.outline = null;
  cube.userData.boundBox = null;
  cube.userData.colour = colour;
  if(image == false){
    cube.userData.image = false;
  }else{
    cube.userData.image = image;
  }

  boxes.push(cube);
  return cube;
}









// enhanceBox
function enhanceBox(name, parentes = [], relations = [[]]) {
  let cube = boxes.find(box => box === name);

  const loader = new FontLoader();

  const textureLoader = new THREE.TextureLoader();

  if (cube.userData.image) {
    // Load and apply image as texture
    textureLoader.load(cube.userData.image, function (texture) {
      cube.geometry.dispose();
      cube.material.dispose();

      const img = texture.image;
      const aspect = img.width / img.height;

      const height = boxSize;
      const width = height * aspect;
  
  
      // Create a new box geometry and apply texture
      // cube.geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
      // cube.material = new THREE.MeshBasicMaterial({ map: texture });


      cube.geometry.dispose();
      cube.material.dispose();
  
      cube.geometry = new THREE.BoxGeometry(width *5, height *5, 0.01); // keep depth thin
      cube.material = new THREE.MeshBasicMaterial({ map: texture });
      cube.material.transparent = true;


      const textBoundingBox = new THREE.Box3().setFromObject(cube); // Calculate bounding box for the text
      const size = new THREE.Vector3();
      textBoundingBox.getSize(size); // Get dimensions of the bounding box
  
  
      const boundingGeometry = new THREE.BoxGeometry(size.x *1.5, size.y *1.5, size.z *1.5);
      const boundingMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        wireframe: true,
        opacity: 0,
      }); // Fully transparent by default
      const boundBox = new THREE.Mesh(boundingGeometry, boundingMaterial);
  
      boundBox.position.copy(cube.position); // Match position with the cube
      boundBox.userData = { isBoundingBox: true, parentCube: cube }; // Attach reference to the original cube
    
      scene.add(boundBox);
      boundings.push(boundBox);
      
      cube.userData.boundBox = boundBox;



    });
  }else{loader.load('src/courierPrime.json', function (font) {
    // Create text geometry
    const textGeometry = new TextGeometry(cube.userData.name, {
      font: font,
      size: boxSize,
      height: 0.2,
      curveSegments: 12,
    });

    cube.geometry.dispose();
    cube.geometry = textGeometry;
    cube.material.transparent = false;
    cube.material.wireframe = false; 
    cube.geometry.center();
  
    const textBoundingBox = new THREE.Box3().setFromObject(cube); // Calculate bounding box for the text
    const size = new THREE.Vector3();
    textBoundingBox.getSize(size); // Get dimensions of the bounding box


    const boundingGeometry = new THREE.BoxGeometry(size.x *1.5, size.y *1.5, size.z *1.5);
    const boundingMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      wireframe: true,
      opacity: 0,
    }); // Fully transparent by default
    const boundBox = new THREE.Mesh(boundingGeometry, boundingMaterial);

    boundBox.position.copy(cube.position); // Match position with the cube
    boundBox.userData = { isBoundingBox: true, parentCube: cube }; // Attach reference to the original cube
  
    scene.add(boundBox);
    boundings.push(boundBox);
    
    cube.userData.boundBox = boundBox;

  });
}


  // if(parentReferences.length < 1){
  //   cube.userData.parents = [cA];
  // }else{
  //   cube.userData.parents = parentReferences;
  // }


  let parentReferences = [];

  parentes.forEach(parent => {
    if (parent) {
      parentReferences.push(parent);
    }
  })
    

    cube.userData.parents = parentReferences;

    //group
    const parentReferencesString = parentReferences.map(parent => parent?.userData?.name || 'extraElement').join(', ');
    cube.userData.group = parentReferencesString;




// Calculate z-level for the current cube
let zLevel = 0;

if (parentReferences && parentReferences.length > 0) {
    // Find the maximum level among all parents
    const maxParentLevel = Math.max(
        ...parentReferences.map(parent => (parent?.userData?.level ?? 0))
    );
    // Set the child's level to one step lower than the highest parent
    zLevel = maxParentLevel + 40;
}

cube.userData.level = zLevel;





    parentReferences = parentReferences ? (Array.isArray(parentReferences) ? parentReferences : [parentReferences]) : [];
  
    // Safely add this cube to each parent
    parentReferences.forEach(parent => {
      if (parent) {
        if (!parent.userData.children) {
          parent.userData.children = [];  // Initialize children array if it doesn't exist
        }
        parent.userData.children.push(cube);
        parent.add(cube);  // Attach to the parent in the scene graph
      }
    });


    if (Array.isArray(relations)) {
      relations.forEach(relation => {
          if (!Array.isArray(relation) || relation.length !== 2) {
              return;
          }
          const [entity, description] = relation;
          if (!entity || !description) {
              return;
          }
          cube.userData.relations.push([entity, description]);
          entity.userData.relations.push([cube, description]);
      });
  }

    scene.add(cube);

    return cube;
    
}






  // Click detection and navigation
  const raycaster = new THREE.Raycaster();
  raycaster.params.Mesh.threshold = 1.5; // Adjust threshold (default is 0)
  const mouse = new THREE.Vector2();

  window.addEventListener('click', onClick);
  window.addEventListener('mousemove', onMouseMove, false);
  function onClick(event) {
    if(mode === structure && explore){
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
  
    //const visibleBoxes = boxes.filter(box => box.visible);
    //const intersects = raycaster.intersectObjects(visibleBoxes);


    const intersects = raycaster.intersectObjects(boundings);

    if (intersects.length > 0) {
      let clickedObject = intersects[0].object;
  
      if (clickedObject.userData.isBoundingBox) {
        clickedObject = clickedObject.userData.parentCube;
      }


    if(clickedObject.visible){

      updateCurrentGroup(clickedObject.userData.group)
      clickedCube = clickedObject;
      exploreButton.innerText = `Explore ${clickedObject.userData.name || 'Unnamed Cube'}`;
      //clickedCubeInfoContainer.innerText = `${clickedObject.userData.name || 'Unnamed Cube'}, ${clickedObject.userData.group}`;


      const children = clickedObject.userData.children;

      let groupBoxes =[];
      children.forEach(box => {
          if (!groupBoxes.includes(box.userData.group)) {
            groupBoxes.push(box.userData.group);
          }
        });

      if(children.length === 0) return;

      if (groupBoxes.length  === 1) {
        currentGroup = children[0].userData.group;
        navigateToChildren(currentGroup, clickedObject);
        clickedObject.visible = false
        return;
      }
      else{
        showChildGroupsOverlay(children, clickedObject);
            }
    }
}
   }else{
    
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
  
    //const visibleBoxes = boxes.filter(box => box.visible);
    //const intersects = raycaster.intersectObjects(visibleBoxes);


    const intersects = raycaster.intersectObjects(boundings);

    if (intersects.length > 0) {
      let clickedObject = intersects[0].object;
  
      if (clickedObject.userData.isBoundingBox) {
        clickedObject = clickedObject.userData.parentCube;
      }


    if(clickedObject.visible){
      updateCurrentGroup(clickedObject.userData.group)
      clickedCube = clickedObject;
      exploreButton.innerText = `Explore ${clickedObject.userData.name || 'Unnamed Cube'}`;
      //clickedCubeInfoContainer.innerText = `${clickedObject.userData.name || 'Unnamed Cube'}, ${clickedObject.userData.group}`;

    }
   }
  }
}














  


//changeMode

// structure button
document.getElementById('structure').addEventListener('click', () => {
    explore = false;
    mode = structure;

    structurePos();
    reverseButton.style.display = 'none';

    //exploreButton.style.display = 'block';
    const rect = structureButton.getBoundingClientRect();
    exploreButton.style.top = `${rect.bottom + 10}px`; // 10px gap below the active button
    exploreButton.style.left = `${rect.left + rect.width / 2 }px`; //- exploreButton.offsetWidth / 2



    manNavigation();
    changeMode()

    let hiddenBoxes = boxes.filter(box => !box.visible);
    let structureBoxes = hiddenBoxes.filter(box => (box.userData.children.length > 0 || box.userData.parents.length > 0))
    structureBoxes.forEach(cube => easeInBoxes(cube));

    let notstructureBoxes = boxes.filter(box => (box.userData.children.length < 1 && box.userData.parents.length < 1))
    notstructureBoxes.forEach(cube =>  easeOutBoxes(cube));
    //easeOutBoxes(cube)


//hellohello

  });


// relations button
document.getElementById('relations').addEventListener('click', () => {
  relationsPos();
  explore = false;
  mode = relations;
  reverseButton.style.display = 'none';

  const rect = relationsButton.getBoundingClientRect();
  exploreButton.style.top = `${rect.bottom + 10}px`; // 10px gap below the active button
  exploreButton.style.left = `${rect.left + rect.width / 2 }px`; //- exploreButton.offsetWidth / 2


  boxes.forEach(box => easeInBoxes(box));
  boxes.filter(box => box.userData.relations.length < 1 ).forEach(box => box.visible = false); //&& box.userData.group !== "extraElement"
  manNavigation();
  changeMode()
  });





// explore structure
  document.getElementById('explore').addEventListener('click', () => {
    
    if(mode === structure){
      structureExplorePos();
      setTimeout(() => {
        explorationView()
        boxes.forEach(box => box.visible = false);

        let strucExploreBoxes = boxes.filter(box => box.userData.group === currentGroup && (box.userData.children.length > 0 || box.userData.parents.length > 0));

        strucExploreBoxes.forEach(box => box.visible = true); //(box.userData.group !== "extraElement"))
      
      
      
      
      
      }, 1000);

    setTimeout(() => {
      
    explore = true;
    reverseButton.style.display = 'block';

    // boxes.filter(box => box.userData.group === !currentGroup).forEach(box => easeOutBoxes(box));

  }, 1500);
} else if (mode === relations){
  relationsExplorePos();
  explorationView()


  explore = true;
}

   });






//reverse
document.getElementById('reverseButton').addEventListener('click', () => {
  if(mode === structure && explore){
  let parentGroups = [];
  
  // Gather unique parent groups
  let groupBoxes = boxes.filter(box => box.userData.group === currentGroup);
  groupBoxes.forEach(box => {
    box.userData.parents.forEach(parent => {
      if(parent !== null){
      if (!parentGroups.includes(parent.userData.group)) {
        parentGroups.push(parent.userData.group);
      }
    } else return;
    });
  });



  // Handle no parents case
  if (parentGroups.length === 0) {
    alert("No parent groups found.");
    return;
  }

  // If only one parent exists, navigate directly
  if (parentGroups.length === 1) {
    currentGroup = parentGroups[0];
    navigateToParent(currentGroup);
    return;
  }

  // If multiple parents, present selection to the user
  const existingOverlay = document.querySelector('.overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }
  
  const overlay = document.createElement('div');
  overlay.classList.add('overlay');

  const groupSelection = document.createElement('div');
  groupSelection.classList.add('group-selection');
  overlay.appendChild(groupSelection);


  parentGroups.forEach(group => {
    const groupButton = document.createElement('button');
    groupButton.textContent = `Parents: ${group}`;  // Display the group number or name
    groupButton.addEventListener('click', () => {
      event.stopPropagation();
      closeOverlay(overlay);
      updateCurrentGroup(group);  // Pass the selected group
      navigateToParent(currentGroup);
    });
    groupSelection.appendChild(groupButton);
  });

  document.body.appendChild(overlay);
  }

});







//mousemove and hover
function onMouseMove(event) {

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
    //const intersects = raycaster.intersectObjects(boxes);

  const intersects = raycaster.intersectObjects(boundings);

  if (intersects.length > 0) {
    let cube = intersects[0].object;

    if (cube.userData.isBoundingBox) {
      cube = cube.userData.parentCube;
    }
    if (hoveredCube !== cube) {
      removeHover(hoveredCube);


      onHover(cube);
    
      hoveredCube = cube;
    }
  } else {
    // Remove hover effects if no cube is intersected
    removeHover(hoveredCube);
    hoveredCube = null;
  }
}




function onHover(cube) {
  if (cube && cube.visible) {

   if(mode === structure && explore){

      if (cube.userData.children.length > 0){
       createOutline(cube);
       if(cube.userData.image == false){
        cube.material.color.set(black);
       }      }
      
      const textContainer = document.getElementById('description-container');
      if (textContainer) {
        textContainer.innerText = cube.userData.name + ': ' + cube.userData.description; // Set the text content
        textContainer.style.display = 'block'; // Ensure it's visible
      }
   }

   if (mode === structure && !explore) {
     createOutline(cube);
     if(cube.userData.image == false){
      cube.material.color.set(black);
     }
     cube.userData.children?.forEach(child => {
      if(child !== null){
       createOutline(child)
       if(child.userData.image == false){
        child.material.color.set(black);
       }
       createLine(cube, child);
      }
   });
     cube.userData.parents?.forEach(parent => {
       if(parent !== null){
        createOutline(parent)
        if(parent.userData.image == false){
          parent.material.color.set(black);
        }
         createLine(cube, parent);
       }
   });
   }


   if(mode === relations && !explore) {
     createOutline(cube);
     cube.material.color.set(black);
    cube.userData.relations?.forEach(([entity, description]) => {
      if (entity) {
        createOutline(entity);
        entity.material.color.set(black);
        createLine(cube, entity);
      }
    });
  }
  if(mode === relations && explore){
    createOutline(cube);
    cube.material.color.set(black);
    cube.userData.relations?.forEach(([entity, description]) => {
      if (entity) {
      createOutline(entity);
      entity.material.color.set(black);
      if(entity.visible && cube.visible){
        createLine(cube, entity);
      }
    }


    // Display the description as an HTML element
      const textContainer = document.getElementById('description-container');
      // if (textContainer) {
      //   textContainer.innerText = description; // Set the text content
      //   textContainer.style.display = 'block'; // Ensure it's visible
      // }


      if (textContainer) {
        textContainer.innerHTML = ''; // Clear existing content
        cube.userData.relations?.forEach(([entity, description]) => {
          if(entity.visible){
          createOutline(entity);
          if (entity.visible && cube.visible) {
            createLine(cube, entity);
          }
    
          // Append each description as a separate line
          const descriptionElement = document.createElement('div');
          descriptionElement.innerText = entity.userData.name + ': ' + description;
          textContainer.appendChild(descriptionElement);
        }
        });
    
        textContainer.style.display = 'block'; // Ensure it's visible
      }

    })

  
  }


  }
}


















// helpers





function manNavigation() {

  let isDragging = false;
  let prevMousePosition = { x: 0, y: 0 };
  
  const canvas = document.querySelector('canvas'); 
  
  canvas.addEventListener('wheel', (event) => {
    if (mode === structure && !explore) {
      camera.position.z += event.deltaY * 0.3; 
    }

    if (mode === relations && !explore) {
      camera.position.x -= event.deltaY * 0.3; 
    }
  });
  
  canvas.addEventListener('mousedown', (event) => {
    if (mode === structure && !explore) {
      isDragging = true;
      prevMousePosition.x = event.clientX;
      prevMousePosition.y = event.clientY;
    }

    if (mode === relations && !explore) {
      isDragging = true;
      prevMousePosition.x = event.clientX;
      prevMousePosition.y = event.clientY;
    }
  });
  
  canvas.addEventListener('mousemove', (event) => {
    if (mode === structure && !explore && isDragging) {
      const deltaX = (event.clientX - prevMousePosition.x) * 0.3; // Adjust drag sensitivity
      const deltaY = (event.clientY - prevMousePosition.y) * 0.3;
  
      // Modify camera's x and z positions based on drag
      camera.position.x -= deltaX;
      camera.position.y += deltaY;
  
      // Update previous mouse position
      prevMousePosition.x = event.clientX;
      prevMousePosition.y = event.clientY;
    }


    if (mode === relations && !explore && isDragging) {
      const deltaX = (event.clientX - prevMousePosition.x) * 0.3; // Adjust drag sensitivity
      const deltaY = (event.clientY - prevMousePosition.y) * 0.3;
  
      // Since the plane is rotated, modify the camera's z and y positions
      camera.position.z -= deltaX;
      camera.position.y += deltaY;
  
      // Update previous mouse position
      prevMousePosition.x = event.clientX;
      prevMousePosition.y = event.clientY;
    }
  });
  
  canvas.addEventListener('mouseup', () => {
    if (mode === structure && !explore) isDragging = false;

    if (mode === relations && !explore) isDragging = false;
  });
  
  canvas.addEventListener('mouseleave', () => {
    if (mode === structure && !explore) isDragging = false;

    if (mode === relations && !explore) isDragging = false;
  });
};


function changeMode() {
  const targetPosition = new THREE.Vector3(0,0,0);
  const rot = new THREE.Euler();


  if (mode === structure && !explore) {
    targetPosition.z += bigCubeSize;
    rot.set(0, 0, 0); // 90 degrees in radians

    showconnections()

  }


  if (mode === relations && !explore) {
    targetPosition.x -= bigCubeSize;

    rot.set(Math.PI / 2, -Math.PI / 2, Math.PI / 2); // 90 degrees in radians

    showconnections()
  }



  gsap.to(camera.position, {
    duration: 1, // Transition duration in seconds
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z,
    ease: "power2.inOut" // Smooth easing function
  });

  gsap.to(camera.rotation, {
    duration: 1,
    x: rot.x,
    y: rot.y,
    z: rot.z,
    ease: "power2.inOut"
  });
}



function explorationView() {
  boxes.forEach(box => {
    removePermLines(box);
  });

  if(mode === structure){
  const group = boxes.filter(child => child.userData.group === currentGroup);
  if (group.length === 0) return;
  


  const boundingBox = new THREE.Box3();
  group.forEach(cube => boundingBox.expandByObject(cube));
  const center = new THREE.Vector3();
  boundingBox.getCenter(center);
  const size = boundingBox.getSize(new THREE.Vector3()).length();

  targetPosition = new THREE.Vector3();
  const rot = new THREE.Euler();

  const distance = size / (2 * Math.tan((camera.fov * Math.PI) / 360));
  targetPosition.set(center.x, center.y, center.z + distance + 5);



  if (mode === structure && explore) {

    // targetPosition.set(currentGroup.position.x, currentGroup.position.y, currentGroup.position.z + 25);
    rot.set(0, 0, 0);
  }


  gsap.to(camera.position, {
    duration: 1, // Transition duration in seconds
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z,
    ease: "power2.inOut" // Smooth easing function
  });

  gsap.to(camera.rotation, {
    duration: 1,
    x: rot.x,
    y: rot.y,
    z: rot.z,
    ease: "power2.inOut"
  });





} else if (mode === relations) {
setTimeout(() => {
  let relat = boxes.filter(child => child.visible === true);
  if (relat.length === 0) return;

  const boundingBox = new THREE.Box3();
  relat.forEach(cube => boundingBox.expandByObject(cube));
  const center = new THREE.Vector3();
  boundingBox.getCenter(center);
  const size = boundingBox.getSize(new THREE.Vector3()).length();
  const distance = size / (2 * Math.tan((camera.fov * Math.PI) / 360));
  let targetPos = new THREE.Vector3(center.x - distance, center.y-10, center.z);

  //Smoothly transition the camera position
  gsap.to(camera.position, {
    duration: 1, // Transition duration in seconds
    x: targetPos.x,
    y: targetPos.y,
    z: targetPos.z,
    ease: "power2.inOut", // Smooth easing function
  });
}, 1000)
}

}





// structure explore helpers
function showChildGroupsOverlay(children, parent) {
  // Example: Dynamically create an HTML overlay with the available groups
  
  const existingOverlay = document.querySelector('.overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  // boxes.forEach(box => {
  //   box.visible = false;
  // });
  
  const overlay = document.createElement('div');
  overlay.classList.add('overlay');

  const groupSelection = document.createElement('div');
  groupSelection.classList.add('group-selection');
  overlay.appendChild(groupSelection);

  let posGroups = [];
  children.forEach(child => {
    if (!posGroups.includes(child.userData.group)) {
      posGroups.push(child.userData.group);
    }
  });

  posGroups.forEach(group => {
    const groupButton = document.createElement('button');
    groupButton.textContent = `Parents: ${group}`;  // Display the group number or name
    // groupButton.removeEventListener('click', previousHandler);
    groupButton.addEventListener('click', () => {
      event.stopPropagation();
      closeOverlay(overlay);
      updateCurrentGroup(group);  // Pass the selected group
      navigateToChildren(currentGroup, parent);      // Close the overlay after selection
    });
    groupSelection.appendChild(groupButton);
  });

  document.body.appendChild(overlay);
}

function updateCurrentGroup(selectedChildGroup) {
  currentGroup = selectedChildGroup;  // This group is chosen by the user
}

function closeOverlay(overlay) {
  overlay.style.display = 'none';  // Immediate hide
  setTimeout(() => {
    overlay.remove();  // Ensure removal
  }, 100);  // Delay for cleanup (short duration)
}


function navigateToChildren(selectedGroup, parent) {
  const children = parent.userData.children.filter(child => child.userData.group === selectedGroup);
  if (children.length === 0) return;

  boxes.forEach(cube => cube.visible = false);
  parent.visible = true;
  children.forEach(child => child.visible = true);

  const boundingBox = new THREE.Box3();
  children.forEach(child => boundingBox.expandByObject(child));

  const center = new THREE.Vector3();
  boundingBox.getCenter(center);
  const size = boundingBox.getSize(new THREE.Vector3()).length();

  const distance = size / (2 * Math.tan((camera.fov * Math.PI) / 360));
  targetPosition.set(center.x, center.y, center.z + distance + 5); // Extra space
  currentLookAt.copy(center);

  parent.visible = false
}

function navigateToParent(selectedGroup) {
  const parentesGroup = boxes.filter(child => child.userData.group === selectedGroup);
  if (parentesGroup.length === 0) return;

  boxes.forEach(cube => cube.visible = false);
  parent.visible = true;
  parentesGroup.forEach(child => child.visible = true);

  const boundingBox = new THREE.Box3();
  parentesGroup.forEach(child => boundingBox.expandByObject(child));

  const center = new THREE.Vector3();
  boundingBox.getCenter(center);
  const size = boundingBox.getSize(new THREE.Vector3()).length();

  const distance = size / (2 * Math.tan((camera.fov * Math.PI) / 360));
  targetPosition.set(center.x, center.y, center.z + distance + 5); // Extra space
  currentLookAt.copy(center);
}




//easing animations
function easeInBoxes(cube) {
  cube.visible = true;
  cube.material.opacity = 0;
  cube.material.transparent = true;

  const totalDuration = 1000; // total fade-in duration in milliseconds
  const stepDuration = 20; // the interval between opacity updates
  let currentOpacity = 0;
  
  const fadeInInterval = setInterval(() => {
    currentOpacity += stepDuration / totalDuration; // increase opacity based on step duration
    cube.material.opacity = currentOpacity;

    // Once the opacity reaches 1, clear the interval
    if (currentOpacity >= 1) {
      clearInterval(fadeInInterval);
    }
  }, stepDuration);
}

function easeOutBoxes(cube) {
  cube.visible = true;
  cube.material.opacity = 1; // Start fully visible
  cube.material.transparent = true;

  const totalDuration = 700; // Total fade-out duration in milliseconds
  const stepDuration = 20; // The interval between opacity updates
  let currentOpacity = 1; // Start at full opacity
  
  const fadeOutInterval = setInterval(() => {
    currentOpacity -= stepDuration / totalDuration; // Gradually decrease opacity
    cube.material.opacity = currentOpacity;

    // Once the opacity reaches 0, clear the interval
    if (currentOpacity <= 0) {
      clearInterval(fadeOutInterval);
      cube.visible = false; // Hide the cube when opacity is 0
    }
  }, stepDuration);
}



// hovering
function createLine(startCube, endCube, color = 0xF7E0C0) {
  const material = new THREE.LineBasicMaterial({ color });
  const geometry = new THREE.BufferGeometry().setFromPoints([
    startCube.position.clone(),
    endCube.position.clone()
  ]);
  const line = new THREE.Line(geometry, material);
  scene.add(line);

  // Store the line in userData of the startCube for cleanup
  if (!startCube.userData.lines) {
    startCube.userData.lines = [];
  }
  startCube.userData.lines.push(line);
}

function removeLines(cube) {
  if (cube && cube.userData.lines) {
    cube.userData.lines.forEach(line => scene.remove(line));
    cube.userData.lines = null;
  }
}


function createOutline(cube, color = 0xF7E0C0) {
  if (cube && !cube.userData.outline) {
    const box =  new THREE.Box3().setFromObject(cube);

    let factor = 0
    // Get the dimensions of the bounding box
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    if(mode === structure){
      factor = size.x
    }else if(mode === relations){
      factor = size.z
    }
    const outlineGeometry = new THREE.CircleGeometry(factor / 1.8);

// const outlineGeometry = new THREE.BoxGeometry(factor * 1.2, size.y * 1.4, 0.1)


    const outlineMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: false,
      opacity: 1,
    });

    const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);
    outlineMesh.position.copy(cube.position);



    // Scale Y based on the object's height to create an oval
    const yScale = (size.y / factor) * 2; // Adjust this ratio if it's too wide or too narrow
    outlineMesh.scale.set(1.3, yScale, 1); // Only scale Y


    scene.add(outlineMesh);

    // Save the outline for later removal
    cube.userData.outline = outlineMesh;

    if (mode === structure){
      outlineMesh.rotation.set(0, 0, 0);
      outlineMesh.position.z -= 1;
    }
    else if(mode === relations){
      outlineMesh.rotation.set(0, - (Math.PI / 2), 0);
      outlineMesh.position.x -= 1;
    }
  }
}




function removeOutline(cube) {
  if (cube && cube.userData.outline) {
    scene.remove(cube.userData.outline);
    cube.userData.outline = null;
  }
}

function removeHover(cube) {
  if (cube) {
    removeOutline(cube);
    if(cube.userData.image == false){
    cube.material.color.set(cube.userData.colour);
    }
    removeLines(cube);

    cube.userData.children?.forEach(child => {
      if(child){
        removeOutline(child)
        // if(cube.userData.image == false){
        child.material.color.set(child.userData.colour);
        // }
        removeLines(child);
      }
  });
    cube.userData.parents?.forEach(parent => {
      if(parent){
        removeOutline(parent)
        parent.material.color.set(parent.userData.colour);
        removeLines(parent);
      }
  });

  cube.userData.relations?.forEach(([entity, description]) => {
    if (entity) {
      removeOutline(entity);
      if(cube.userData.image == false){
      entity.material.color.set(cube.userData.colour);
      }
      removeLines(entity);
    }
  });

  //text container
    const textContainer = document.getElementById('description-container');
    if (textContainer) {
      textContainer.style.display = 'none';
      textContainer.innerText = ''; // Clear the content
    }
  
  }
}



// positions

// structure
function structurePos() {
  setTimeout(() => {


//rotation
    boxes.forEach(cube => {
      cube.rotation.set(0, 0, 0);
      cube.userData.boundBox.rotation.set(0, 0, 0);
    });
  

//levelSpacing
    const levelSpacing = 40; // Distance between levels (y-axis)
    const groupSpacing = 130; // Distance between groups within a level (x-axis)
    const boxSpacing = 100;    // Distance between boxes within a cluster (x-axis)

    // Set z-position to the front face of the big cube
    const zFrontFace = bigCubeSize / 2;

    const levels = {};


    let structureBoxes = boxes.filter(box => (box.userData.children.length > 0 || box.userData.parents.length > 0))//(box => box.userData.group !== "extraElement");
  
    let notStructureBoxes = boxes.filter(box => box.userData.group === "extraElement" && box.userData.children.length < 1);
    notStructureBoxes.forEach(cube => {cube.visible = false;});


    structureBoxes.forEach(cube => {
      const level = cube.userData.level;
      if (!levels[level]) levels[level] = [];
      levels[level].push(cube);
    });


    // Calculate the total height of all levels to center along the y-axis
    const totalLevels = Object.keys(levels).length;
    const totalHeight = (totalLevels - 1) * levelSpacing;
    const centerYOffset = totalHeight / 2;

    Object.keys(levels).forEach((yLevel, levelIndex) => {
      const cubesAtLevel = levels[yLevel];

      // Group cubes by their `group` value
      const clusters = {};
      cubesAtLevel.forEach(cube => {
        const cluster = cube.userData.group;
        if (!clusters[cluster]) clusters[cluster] = [];
        clusters[cluster].push(cube);
      });

      // Calculate total width of all clusters, including box spacing
      let totalWidth = 0;
      Object.values(clusters).forEach((cubesInCluster) => {
        const clusterWidth = (cubesInCluster.length - 1) * boxSpacing;
        totalWidth += clusterWidth + groupSpacing;
      });
      totalWidth -= groupSpacing; // Remove the last unnecessary group spacing

      const levelOffsetX = -totalWidth / 2;

      let currentX = levelOffsetX;

      Object.keys(clusters).forEach((clusterKey) => {
        const cubesInCluster = clusters[clusterKey];

        cubesInCluster.forEach((cube, i) => {
          const x = currentX + i * boxSpacing;               // Spread along the x-axis
          const y = centerYOffset - levelIndex * levelSpacing; // Spread along the y-axis
          const z = zFrontFace;                                 // Fixed on the front face

        // cube.userData.boundBox.set(x,y,z)
        
          // Animate the cube's position
          gsap.to(cube.position, {
            duration: 1,
            x: x,
            y: y,
            z: z,
            ease: "power2.inOut",
            onUpdate: () => {
              // Update bounding box after the position is updated

              boxes.forEach(box => {
                box.userData.boundBox.position.copy(box.position);
              })   
            }
          });
        });

        // Update currentX for the next cluster
        currentX += (cubesInCluster.length - 1) * boxSpacing + groupSpacing;
      });
    });
  }, 500);
}


function structureExplorePos() {
  // setTimeout(() => {
  const levelSpacing = 300; // Distance between levels on the z-axis
  const groupSpacing = 100; // Distance between groups within a level
  const boxSpacing = 80;    // Distance between boxes within a cluster

//rotation
boxes.forEach(cube => {
  cube.rotation.set(0, 0, 0);
  cube.userData.boundBox.rotation.set(0, 0, 0);

});


  const levels = {};


  // let structureBoxes = boxes.filter(box => box.userData.group !== "extraElement");
  
  // let notStructureBoxes = boxes.filter(box => box.userData.group === "extraElement");

  let structureBoxes = boxes.filter(box => box.userData.children.length > 0 || box.userData.parents.length > 0)//(box => box.userData.group !== "extraElement");
  
  let notStructureBoxes = boxes.filter(box => box.userData.group === "extraElement" && box.userData.children.length < 1);

  notStructureBoxes.forEach(cube => {cube.visible = false;});



  structureBoxes.forEach(cube => {
    const level = cube.userData.level;
    if (!levels[level]) levels[level] = [];
    levels[level].push(cube);
  });

  Object.keys(levels).forEach((zLevel, levelIndex) => {
    const cubesAtLevel = levels[zLevel];

    // Group cubes by their `group` value
    const clusters = {};
    cubesAtLevel.forEach(cube => {
      const cluster = cube.userData.group;
      if (!clusters[cluster]) clusters[cluster] = [];
      clusters[cluster].push(cube);
    });

    const totalWidth = Object.keys(clusters).length * groupSpacing;
      const levelOffsetX = -totalWidth / 2;

    Object.keys(clusters).forEach((clusterKey, clusterIndex) => {
      const cubesInCluster = clusters[clusterKey];

      const clusterOffsetX = levelOffsetX + clusterIndex * groupSpacing;

      const cols = Math.ceil(Math.sqrt(cubesInCluster.length));
      cubesInCluster.forEach((cube, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);

        const x = clusterOffsetX + col * boxSpacing;
        const y = row * boxSpacing;
        const z = -levelIndex * levelSpacing; // Place at the correct z-level



        gsap.to(cube.position, {
          duration: 1,
          x: x,
          y: y,
          z: z,
          ease: "power2.inOut",
          onUpdate: () => { 
              boxes.forEach(box => {
                box.userData.boundBox.position.copy(box.position);
              })   
           }
        });

        // Set the position of the cube
        // cube.position.set(x, y, z);
      });
    });
  });
// }, 500);
}



//relations
function relationsPos() {
setTimeout(() => {
  
  // roteteCubes
  boxes.forEach(cube => {
    cube.rotation.set(0, - (Math.PI / 2), 0);
    cube.userData.boundBox.rotation.set(0, - (Math.PI / 2), 0);

  });


  const groupSpacing = 50;    // Spacing between groups
  const cloudSpread = 40;     // Spread of cubes within each group
  const minDistance = 20;     // Minimum distance between cubes to avoid overlap
  const maxAttempts = 50;     // Max retries to find a non-overlapping position   // Assuming the big cube has a size of 100 units

  // Group cubes by their `group` value
  const clusters = {};
  boxes.forEach(cube => {
    const cluster = cube.userData.group;
    if (!clusters[cluster]) clusters[cluster] = [];
    clusters[cluster].push(cube);
  });

  // Arrange groups in a grid layout
  const groupKeys = Object.keys(clusters);
  const numCols = Math.ceil(Math.sqrt(groupKeys.length));
  const numRows = Math.ceil(groupKeys.length / numCols);

  // Calculate total width and height of the grid to center the layout
  const totalWidth = (numCols - 1) * groupSpacing;
  const totalHeight = (numRows - 1) * groupSpacing;

  // Offsets to center the grid on the left face
  const centerZOffset = -totalWidth / 2;
  const centerYOffset = totalHeight / 2;
  const leftFaceX = -bigCubeSize / 2; // Position along the left face

  groupKeys.forEach((clusterKey, index) => {
    // Calculate grid position for each group (using z and y instead of x and y)
    const col = index % numCols;
    const row = Math.floor(index / numCols);
    const groupZ = centerZOffset + col * groupSpacing;   // Spread groups along the z-axis
    const groupY = centerYOffset - row * groupSpacing;   // Spread groups along the y-axis

    const cubesInCluster = clusters[clusterKey];

    // Position cubes within each group with collision avoidance
    const placedPositions = []; // Store placed positions to check for collisions

    cubesInCluster.forEach(cube => {
      let validPosition = false;
      let randomZ, randomY, randomX;
      let attempts = 0;

      while (!validPosition && attempts < maxAttempts) {
        randomZ = groupZ + (Math.random() - 0.5) * cloudSpread;  // Random spread along z-axis //(Math.random() - 0.5) 
        randomY = groupY + (Math.random() - 0.5) * cloudSpread;  // Random spread along y-axis
        randomX = leftFaceX;                                      // Align on the left face

        // Ensure cubes do not overlap within the group
        validPosition = placedPositions.every(pos => {
          const dx = pos.x - randomX;
          const dy = pos.y - randomY;
          const dz = pos.z - randomZ;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          return distance >= minDistance;
        });

        attempts++;
      }



      gsap.to(cube.position, {
        duration: 1,            // Animation duration in seconds
        x: randomX,
        y: randomY,
        z: randomZ,
        ease: "power2.inOut", 
        onUpdate: () => {
          boxes.forEach(box => {
            box.userData.boundBox.position.copy(box.position);
          })   
        }  // Smooth easing function
      });

      // Save the new position to avoid overlaps
      placedPositions.push({ x: randomX, y: randomY, z: randomZ });
    });
  });
}, 500);
}






function relationsExplorePos() {
  // rotation reset
  boxes.forEach(cube => {
    cube.rotation.set(0, - (Math.PI / 2), 0);
    cube.userData.boundBox.rotation.set(0, - (Math.PI / 2), 0);
  });
 
    //const groupCenterObject = boxes.find(cube => cube.userData.group === currentGroup);

    const groupCenterObject = clickedCube;



    if (!groupCenterObject) return;
    groupCenterObject.position.set(0, 0, 0);  // Center position
    const relatedObjects = [];

    groupCenterObject.userData.relations.forEach(([relatedCube]) => {
      if (relatedCube !== groupCenterObject && !relatedObjects.includes(relatedCube)) {
        relatedObjects.push(relatedCube);
      }
    })

    const radius = 50;  // The radius of the circle around the center
    const angleIncrement = (2 * Math.PI) / relatedObjects.length;

    relatedObjects.forEach((relatedCube, index) => {
      const angle = angleIncrement * index;
      const x = 0;
      const z = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);

      gsap.to(relatedCube.position, {
        duration: 1,
        x: x,
        y: y,
        z: z,
        ease: "power2.inOut",
        onUpdate: () => {
          boxes.forEach(box => {
           box.userData.boundBox.position.copy(box.position);
          })   
        } 
      });
    });

    boxes.forEach(cube => {cube.visible = false});
    groupCenterObject.visible = true;
    relatedObjects.forEach(cube => cube.visible = true);
}





function createConstantLines(startCube, endCube, color = 0xaeaeae) {


    if(startCube.userData.status == "theories"){color = red}
    else if(startCube.userData.status  == "prototype"){color = blue}
    else if(startCube.userData.status  == "results"){color = green}


  const material = new THREE.LineBasicMaterial({ color, transparent: false, opacity: 0.2, depthWrite: false});
  const geometry = new THREE.BufferGeometry().setFromPoints([
    startCube.position.clone(),
    endCube.position.clone()
  ]);
  const line = new THREE.Line(geometry, material);
  line.renderOrder = 0;
  scene.add(line);

  // Store the line in userData of the startCube for cleanup
  if (!startCube.userData.permLines) {
    startCube.userData.permLines = []; // Initialize permLines if it doesn't exist
  }

  startCube.userData.permLines.push(line);

}


function createPermOutline() {
  if(mode === structure) {
  boxes.forEach(startCube => {
    console.log(cube.userData.image)
    if(cube.userData.image == false){
      return
    }else{

    ///xxx

    const box = new THREE.Box3().setFromObject(startCube); // Get bounding box of the mesh

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    let Outcol = startCube.userData.colour;

    let factor;
    if (mode === structure) {
      factor = size.x;
    } else if (mode === relations) {
      factor = size.z;
    }

    const outlineGeometry = new THREE.BoxGeometry(factor * 1.05, size.y * 1.05, 0.1);

    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: Outcol,
      transparent: false,
      opacity: 1,
    });

    const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);
    outlineMesh.position.copy(startCube.position);
    outlineMesh.position.z -= 1
    scene.add(outlineMesh);

    // Save the outline for later removal
    startCube.userData.outline = outlineMesh;
  }
  });
}
}








function removePermLines(cube) {
  if (cube && cube.userData.permLines && cube.userData.permLines.length > 0) {
    // Remove each line from the scene
    cube.userData.permLines.forEach(line => {
      scene.remove(line);
      line.geometry.dispose();  // Clean up geometry to prevent memory leaks
      line.material.dispose();  // Clean up material to prevent memory leaks
    });

    // Clear the permLines array
    cube.userData.permLines = []; // Reset the array after removal
  } else {
    console.log("No permanent lines to remove for cube:", cube);
  }
}






function showconnections() {

  if (mode === structure) {
    // Cleanup all previously created lines
    boxes.forEach(box => {
      removePermLines(box);
      if (box.userData.PermStatusline && box.userData.PermStatusline.length) {
        box.userData.PermStatusline.forEach(outline => scene.remove(outline));
        box.userData.PermStatusline = []; // Reset
      }
    });

    // Show connections (create new lines)
    setTimeout(() => {
    // createPermOutline()
    boxes.forEach(box => {
      if (box.userData.children) {
        box.userData.children.forEach(child => {
          createConstantLines(box, child);
        });
      }
    });
  }, 2000)




  } else if (mode === relations) {
    // Cleanup all previously created lines
    boxes.forEach(box => {
      removePermLines(box);
      if (box.userData.PermStatusline && box.userData.PermStatusline.length) {
        box.userData.PermStatusline.forEach(outline => scene.remove(outline));
        box.userData.PermStatusline = []; // Reset
      }
  
    });

    // Show connections (create new lines for relations)
    setTimeout(() => {
    boxes.forEach(box => {
      if (box.userData.relations) {
        box.userData.relations.forEach(([entity, description]) => {
          createConstantLines(box, entity);
        });
      }
    });
  }, 2000)


}
}












  // Animation loop
  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function animate() {
    requestAnimationFrame(animate);
    if(mode === structure && explore){ //mode === structure &&
      camera.position.lerp(targetPosition, 0.05);
    }

    boxes.filter(cube => cube.userData.name === "cA").forEach(cube => {cube.visible = false});

    renderer.render(scene, camera);
  }
  animate();





















  // Example
    // Example
      // Example
        // Example
          // Example
            // Example


  // Example boxes
// Parent level 0






// const cA = createBox(null);  // Top-level box (Primordial Deities)
// scene.add(cA);



//ca
const cA = createBox(
  "cA",
  "",
  "0"
);


const titlePage = createBox(
  "Learning Theories",
  "Information structuring",
  "general",
  "assets/topic.png"
);

// const topic = createBox(
//   "Learning / Information Acquisition",
//   "Information structuring",
//   "general",
//   false
// );

// const visualLearning = createBox(
//   "Visual Information Structuring / \n Graph Representations",
//   "Information structuring",
//   "general",
//   false
// );
// const graphs = createBox(
//   "Graph Representation",
//   "Information structuring",
//   "general",
//   false
// );


const researchQuestion = createBox(
  "How can semantic deconstructions \n through graph visualizations \n help to enhance meaningful learning?",
  "Information structuring",
  "general",
  "assets/theme.jpeg"
);

const deconstruction = createBox(
  "graph deconstruction",
  "Information structuring",
  "general",
  "assets/deconstruction.jpeg"
);



//theories
const theories = createBox(
  "Visual Deconstruction",
  "base theories",
  "theories",
  false
);

    // const knowledgeTheories = createBox(
    //   "Information Representation",
    //   "base theories",
    //   "theories",
    //   false
    // )

          // const organisationalTheories = createBox(
          //   "Organisational",
          //   "base theories",
          //   "theories",
          //   false
          // );
                  const cognitiveLoad = createBox(
                    "Cognitive Load Theory",
                    "Cognitive Load Theory",
                    "theories",
                   "assets/sweller.jpeg"
                  );

                      // const sweller = createBox(
                      //   "John Sweller",
                      //   "Cognitive Load Theory",
                      //   "theories",
                      //   "/assets/jSweller.png"
                      // );

                      // const intrinsic = createBox(
                      //   "Intrinsic Cognitive Loads",
                      //   "cognitive work that is provoked by the difficulty of the material",
                      //   "theories",
                      //   false
                      // );

                      // const extraneous = createBox(
                      //   "Extraneous Cognitive Loads",
                      //   "cognitive work that emerges from the way information is presented",
                      //   "theories",
                      //   false
                      // );


                  

                  const chunking = createBox(
                    "Chunking Theory",
                    "Chunking Theory",
                    "theories",
                    "assets/new1.jpeg"
                  );

                      // const Miller = createBox(
                      //   "George Miller",
                      //   "Chunking Theory",
                      //   "theories",
                      //   "/assets/gMiller2.jpg"
                      // );

                      // const chunk = createBox(
                      //   "George Miller",
                      //   "Chunking Theory",
                      //   "theories",
                      //   "/assets/chunks.png"
                      // );

          // const pkTheories = createBox(
          //   "Prior Knowledge",
          //   "base theories",
          //   "theories",
          //   false
          // );
                  const meaningfulLearning = createBox(
                    "Meaningful Learning Theory",
                    "base theories",
                    "theories",
                    "assets/new2.jpeg"
                  );

                  // const superOrdinate = createBox(
                  //   "Superordinate Learning",
                  //   "base theories",
                  //   "theories",
                  //   "/assets/superordinate.png"
                  // );

                  // const subOrdinate = createBox(
                  //   "Subordinate Learning",
                  //   "base theories",
                  //   "theories",
                  //   "/assets/subordinate.png"
                  // );
                  // const combOrdinate = createBox(
                  //   "Combinational Learning",
                  //   "base theories",
                  //   "theories",
                  //   "/assets/combinational.png"
                  // );
          // const mcTheories = createBox(
          //   "Multi-Component",
          //   "base theories",
          //   "theories",
          //   false
          // );

              const senses = createBox(
                "Multi-Component Theories",
                "stimulation of several components instead of limiting the memorization to one",
                "prototype",
                "assets/multiComponent.jpeg"
              );




const nodelinks = createBox(
  "Node-Link-Graphs",
  "graph theories",
  "theories",
  false
);

          // const conceptMaps = createBox(
          //   "Node-Link-Graphs",
          //   "graph theories",
          //   "theories",
          //   "assets/conceptMap.jpeg"
          // );

          const knowledgeMap = createBox(
            "Node-Link-Graphs",
            "graph theories",
            "theories",
            "assets/knowledgeMap.jpeg"
          );

//           const mindMap = createBox(
//             "Node-Link-Graphs",
//             "graph theories",
//             "theories",
//             "assets/mindMap.jpeg"
//           );

          const conceptualDiagram = createBox(
            "Node-Link-Graphs",
            "graph theories",
            "theories",
            "assets/conceptualDiagram.jpeg"
          );

//           const cognitiveMap = createBox(
//             "Node-Link-Graphs",
//             "graph theories",
//             "theories",
//             "assets/cognitiveMap.jpeg"
//           );









//prototype
const prototype = createBox(
  "Prototype",
  "concrete implementation",
  "prototype",
  false
);
// const framework = createBox(
//   "Framework",
//   "design guidelines",
//   "prototype",
//   false
// );

      // const functionalities = createBox(
      //   "Functionalities",
      //   "design guidelines",
      //   "prototype",
      //   false
      // );

          const useCase = createBox(
            "Use Case",
            "design guidelines",
            "prototype",
            false 
          );

              const text = createBox(
                "Text",
                "design guidelines",
                "prototype",
                "assets/interface.png"
              );

          const mappingStructure = createBox(
            "Mapping Structure",
            "design guidelines",
            "theories",
            false
          );

            const cube = createBox(
              "Mapping Structure",
              "design guidelines",
              "prototype",
              "assets/cubeThree.jpeg"
            );

              const hierarchies = createBox(
                "Hierarchies",
                "This mapping shows hierarchical structures by sorting entities in superordinate and subordinate elements. guidelines",
                "theories",
              "assets/hierarchies.jpeg"
              );

                      // const hierarchies_1 = createBox(
                      //   "Hierarchies",
                      //   "This mapping shows hierarchical structures by sorting entities in superordinate and subordinate elements. guidelines",
                      //   "prototype",
                      //   "assets/mappings/hierarchies_1.png"
                      // );

                      // const hierarchies_2 = createBox(
                      //   "Hierarchies",
                      //   "This mapping shows hierarchical structures by sorting entities in superordinate and subordinate elements. guidelines",
                      //   "prototype",
                      //   "assets/mappings/hierarchies_2.png"                      );


              const dynamics = createBox(
                "Dynamics",
                "This mapping shows non-structural relationships of influence and change between entities.",
                "theories",
                "assets/dynamics.jpeg"
              );

                  // const dynamics_1 = createBox(
                  //   "Dynamics",
                  //   "This mapping shows non-structural relationships of influence and change between entities.",
                  //   "prototype",
                  //   "assets/mappings/dynamics_1.png"                  );


                  // const dynamics_2 = createBox(
                  //   "Dynamics",
                  //   "This mapping shows non-structural relationships of influence and change between entities.",
                  //   "prototype",
                  //   "assets/mappings/dynamics_2.png"                  );


              const types = createBox(
                "Types",
                "This mapping shows the types of entities.",
                "theories",
                "assets/types.jpeg"
              );

                  // const types_1 = createBox(
                  //   "Types",
                  //   "This mapping shows the types of entities.",
                  //   "prototype",
                  //   "assets/mappings/types_1.png"
                  // );

                  // const types_2 = createBox(
                  //   "Types",
                  //   "This mapping shows the types of entities.",
                  //   "prototype",
                  //   "assets/mappings/types_2.png"
                  // );

              const sequence = createBox(
                "Sequence",
                "This mapping shows sequential orders of entities.",
                "theories",
                "assets/sequence.jpeg"
              );

                  // const sequence_1 = createBox(
                  //   "Themes",
                  //   "This mapping shows sequential orders of entities.",
                  //   "prototype",
                  //   "assets/mappings/sequence_1.png"
                  // );

                  // const sequence_2 = createBox(
                  //   "Themes",
                  //   "This mapping shows sequential orders of entities.",
                  //   "prototype",
                  //   "assets/mappings/sequence_2.png"
                  // );
    
              const latent = createBox(
                "Latent",
                "This mapping combines the parameters of the other mappings and therefore shows overall similarity of entities in a latent space.",
                "theories",
                "assets/latent.jpeg"
              );

                  // const latent_1 = createBox(
                  //   "Latent",
                  //   "This mapping combines the parameters of the other mappings and therefore shows overall similarity of entities in a latent space.",                "prototype",
                  //   "assets/mappings/latent.png"
                  // );

      const interfac = createBox(
        "Interface",
        "design guidelines",
        "prototype",
        false
      );

      const interaction = createBox(
        "Interaction",
        "design guidelines",
        "prototype",
        "assets/interaction.jpeg"
      );


      // const graphics = createBox(
      //   "Graphics",
      //   "design guidelines",
      //   "prototype",
      //   false
      // );

          const gestalt = createBox(
            "Gestalt Principles",
            "design guidelines",
            "prototype",
            "assets/gestalt.jpeg"
          );


  const implementation = createBox(
    "Implementation",
    "Implementation",
    "prototype",
    false
  );

      const textCorpus = createBox(
        "Text Corpus",
        "Implementation",
        "prototype",
        false
      );

      const inputWord = createBox(
        "Input Word",
        "Implementation",
        "prototype",
        false
      );

          const llm_1 = createBox(
            "Input Word",
            "Implementation",
            "prototype",
            "assets/p1.jpeg"
          );

          const llm_2 = createBox(
            "Implementation",
            "Implementation",
            "prototype",
            "assets/codes2.jpeg"
          );

          const llm_3 = createBox(
            "Implementation",
            "Implementation",
            "prototype",
            "assets/codes3.jpeg"
          );

          const llm_4 = createBox(
            "Implementation",
            "Implementation",
            "prototype",
            "assets/codes4.jpeg"
          );


              const limitationsProto = createBox(
                "Limitations",
                "Implementation",
                "prototype",
                false
              );







// const implementation = createBox(
//   "Implementation",
//   "concrete implementation",
//   "prototype",
//   false
// );



//results
const evaluation = createBox(
  "Evaluation",
  "evaluation process",
  "results",
  false
);

    const guidelines = createBox(
      "Interview Guidelines",
      "evaluation process",
      "results",
      "assets/iguidelines.jpeg"
    );

    const part1 = createBox(
      "Contextualisation",
      "evaluation process",
      "results",
      false
    );

            const two = createBox(
              "Interview Part 2",
              "evaluation process",
              "results",
              "assets/evaluation/02.jpeg"
            );
            const three = createBox(
              "Interview Part 2",
              "evaluation process",
              "results",
              "assets/evaluation/03.jpeg"
            );
            const threeone = createBox(
              "Interview Part 2",
              "evaluation process",
              "results",
              "assets/evaluation/03.2.jpeg"
            );
            const four = createBox(
              "Interview Part 2",
              "evaluation process",
              "results",
              "assets/evaluation/04.jpeg"
            );


    const part2 = createBox(
      "Direct Analysis",
      "evaluation process",
      "results",
      false
    );

            const five = createBox(
              "Interview Part 2",
              "evaluation process",
              "results",
              "assets/evaluation/05.jpeg"
            );
            const six = createBox(
              "Interview Part 2",
              "evaluation process",
              "results",
              "assets/evaluation/06.jpeg"
            );
            const seven = createBox(
              "Interview Part 2",
              "evaluation process",
              "results",
              "assets/evaluation/07.jpeg"
            );
            const eight = createBox(
              "Interview Part 2",
              "evaluation process",
              "results",
              "assets/evaluation/08.jpeg"
            );
            const nine = createBox(
              "Interview Part 2",
              "evaluation process",
              "results",
              "assets/evaluation/09.jpeg"
            );
            const ten = createBox(
              "Interview Part 2",
              "evaluation process",
              "results",
              "assets/evaluation/10.jpeg"
            );


                          const assesment = createBox(
                            "Assessment",
                            "evaluation process",
                            "results",
                            "assets/assesment.jpeg"
                          );

                          // const improvement = createBox(
                          //   "Improvement Areas",
                          //   "evaluation process",
                          //   "discussion",
                          //   false
                          // );

                          //         const LLMtwo = createBox(
                          //           "LLM",
                          //           "evaluation process",
                          //           "discussion",
                          //           false
                          //         );

                          //         const training = createBox(
                          //           "Training",
                          //           "evaluation process",
                          //           "discussion",
                          //           false
                          //         );

                          //         const models = createBox(
                          //           "Bigger models",
                          //           "evaluation process",
                          //           "discussion",
                          //           false
                          //         );


                          //         const complexity = createBox(
                          //           "Graph Complexity",
                          //           "evaluation process",
                          //           "discussion",
                          //           false
                          //         );

                          // const success = createBox(
                          //   "Success",
                          //   "evaluation process",
                          //   "discussion",
                          //   false
                          // );


                          //       const deconstruction = createBox(
                          //         "Semantic Deconstruction",
                          //         "evaluation process",
                          //         "discussion",
                          //         false
                          //       );
                          //           const overview = createBox(
                          //             "Overview",
                          //             "evaluation process",
                          //             "discussion",
                          //             false
                          //           );
                          //           const vocabulary = createBox(
                          //             "Terminology",
                          //             "evaluation process",
                          //             "discussion",
                          //             false
                          //           );



                          //       const gvis = createBox(
                          //         "Graph Visualising",
                          //         "evaluation process",
                          //         "discussion",
                          //         false
                          //       );

                          //           const memorisation = createBox(
                          //             "Memorisation",
                          //             "evaluation process",
                          //             "discussion",
                          //             false
                          //           );

                          //           const media = createBox(
                          //             "Media Translation",
                          //             "evaluation process",
                          //             "discussion",
                          //             false
                          //           );

                          //       const interactiontwo = createBox(
                          //         "Interaction",
                          //         "evaluation process",
                          //         "discussion",
                          //         false
                          //       );
    




    const limitations = createBox(
      "Limitations",
      "evaluation process",
      "results",
      false
    );

        // const homogeinity = createBox(
        //   "Participants Homogeneity",
        //   "evaluation process",
        //   "results",
        //   false
        // );

        // const textPassage = createBox(
        //   "Text Passage",
        //   "evaluation process",
        //   "results",
        //   false
        // );



// const discussion = createBox(
//   "Results",
//   "results discussion",
//   "results",
//   false
// );



enhanceBox(cA, [null],[[]])

enhanceBox(titlePage, [cA], [
]);

// enhanceBox(topic, [titlePage], [
// ]);
// enhanceBox(visualLearning, [topic], [
// ]);
// enhanceBox(graphs, [visualLearning], [
// ]);

enhanceBox(researchQuestion, [titlePage], [
]);

enhanceBox(deconstruction, [researchQuestion], [
]);


//theories
enhanceBox(theories, [deconstruction], [
]);
      // enhanceBox(knowledgeTheories
      //   , [theories], [
      // ]);

                // enhanceBox(organisationalTheories, [knowledgeTheories], [
                // ]);
                enhanceBox(cognitiveLoad, [theories], [
                ]);

                      // enhanceBox(sweller, [cognitiveLoad], [
                      // ]);
                      // enhanceBox(intrinsic, [cognitiveLoad], [
                      // ]);
                      // enhanceBox(extraneous, [cognitiveLoad], [
                      // ]);

                enhanceBox(chunking, [cognitiveLoad], [
                ]);
                    // enhanceBox(Miller, [chunking], [
                    // ]);
                    // enhanceBox(chunk, [chunking], [
                    // ]);


                // enhanceBox(pkTheories, [knowledgeTheories], [
                // ]);
                enhanceBox(meaningfulLearning, [cognitiveLoad], [
                ]);
                    // enhanceBox(superOrdinate, [meaningfulLearning], [
                    // ]);
                    // enhanceBox(subOrdinate, [meaningfulLearning], [
                    // ]);
                    // enhanceBox(combOrdinate, [meaningfulLearning], [
                    // ]);


                // enhanceBox(mcTheories, [knowledgeTheories], [
                // ]);


      enhanceBox(nodelinks, [chunking, meaningfulLearning], [
      ]);

            // enhanceBox(conceptMaps, [nodelinks], [
            // ]);
            enhanceBox(knowledgeMap, [nodelinks], [
            ]);
      //       enhanceBox(mindMap, [nodelinks], [
      //       ]);
            enhanceBox(conceptualDiagram, [nodelinks], [
            ]);
      //       enhanceBox(cognitiveMap, [nodelinks], [
      //       ]);




//prototype
enhanceBox(prototype, [deconstruction], [
]);
    // enhanceBox(framework, [prototype], [
    // ]);
          // enhanceBox(implementation, [prototype], [
          // ]);


          enhanceBox(useCase, [prototype], [
          ]);
 
              enhanceBox(text, [useCase], [
              ]);

              enhanceBox(senses, [text], [
              ]);


enhanceBox(interfac, [prototype], [
]);
          
enhanceBox(interaction, [interfac], [
]);



          // enhanceBox(graphics, [interfac], [
          // ]);
          
          enhanceBox(gestalt, [interfac], [
          ]);
          


          // enhanceBox(functionalities, [framework], [
          // ]);
        enhanceBox(mappingStructure, [knowledgeMap, conceptualDiagram, gestalt], [
        ]);
                enhanceBox(hierarchies, [mappingStructure], [
                ]);
                    // enhanceBox(hierarchies_1, [hierarchies], [
                    // ]);
                    // enhanceBox(hierarchies_2, [hierarchies], [
                    // ]);

                enhanceBox(dynamics, [mappingStructure], [
                ]);
                    // enhanceBox(dynamics_1, [dynamics], [
                    // ]);
                    // enhanceBox(dynamics_2, [dynamics], [
                    //       ]);

                enhanceBox(types, [mappingStructure], [
                ]);
                    // enhanceBox(types_1, [types], [
                    // ]);
                    // enhanceBox(types_2, [types], [
                    //         ]);

                enhanceBox(sequence, [mappingStructure], [
                ]);
                    // enhanceBox(sequence_1, [sequence], [
                    // ]);
                    // enhanceBox(sequence_2, [sequence], [
                    // ]);

                enhanceBox(latent, [mappingStructure], [
                ]);
                    // enhanceBox(latent_1, [latent], [
                    // ]);

                    enhanceBox(cube, [latent, sequence, sequence, types, dynamics, hierarchies], [
                    ]);

                          enhanceBox(implementation, [cube, senses], [
                          ]);
                          enhanceBox(textCorpus, [implementation], [
                          ]);
                          enhanceBox(inputWord, [implementation], [
                          ]);
                          enhanceBox(llm_1, [inputWord, textCorpus], [
                          ]);
                          enhanceBox(llm_2, [llm_1], [
                          ]);
                          enhanceBox(llm_3, [llm_2], [
                          ]);
                          enhanceBox(llm_4, [llm_3], [
                          ]);
                    

                              enhanceBox(limitationsProto, [llm_4], [
                              ]);





//results
enhanceBox(evaluation, [limitationsProto], [
]);
    enhanceBox(guidelines, [evaluation], [
    ]);


        enhanceBox(part2, [guidelines], [
        ]);

            enhanceBox(five, [part2], [
            ]);
            enhanceBox(six, [part2], [
            ]);
            enhanceBox(seven, [part2], [
            ]);
            enhanceBox(eight, [part2], [
            ]);
            enhanceBox(nine, [part2], [
            ]);
            enhanceBox(ten, [part2], [
            ]);


            enhanceBox(assesment, [five, six, seven, eight, nine, ten], [
            ]);

        enhanceBox(part1, [assesment], [
        ]);
            enhanceBox(two, [part1], [
            ]);
            enhanceBox(three, [part1], [
            ]);
            enhanceBox(threeone, [three], [
            ]);
            enhanceBox(four, [part1], [
            ]);

            // enhanceBox(improvement, [assesment], [
            // ]);
            //     enhanceBox(LLMtwo, [improvement], [
            //     ]);
            //            enhanceBox(training, [LLMtwo], [
            //             ]);
            //             enhanceBox(models, [LLMtwo], [
            //             ]);

            //         enhanceBox(complexity, [improvement, five], [
            //         ]);
  
            // enhanceBox(success, [assesment], [
            // ]);

            //     enhanceBox(deconstruction, [success], [
            //     ]);

            //         enhanceBox(overview, [deconstruction, five], [
            //         ]);

            //         enhanceBox(vocabulary, [deconstruction], [
            //         ]);

            //     enhanceBox(gvis, [success], [
            //     ]);

            //         enhanceBox(memorisation, [gvis, five], [
            //         ]);
            //         enhanceBox(media, [gvis, five], [
            //         ]);
            //     enhanceBox(interactiontwo, [success], [
            //     ]);
  




        enhanceBox(limitations, [guidelines], [
        ]);


            // enhanceBox(homogeinity, [limitations], [
            // ]);
            // enhanceBox(textPassage, [limitations], [
            // ]);




setTimeout(() => {
  
  structureExplorePos();

}, 1000)

});
