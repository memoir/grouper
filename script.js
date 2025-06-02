// ---------- Konfiguration und Logik für die Gruppeneinteilung ----------
    let fieldConfig = [
      // Start with no groups
    ];

    let items = [
      // Start with no items
    ];

    // Helper to update the group space info
    function updateGroupSpaceInfo() {
      const totalMax = fieldConfig.reduce((sum, f) => sum + f.maxItems, 0);
      const diff = items.length - totalMax;
      const info = document.getElementById('group_space_info');
      info.classList.remove('info-green', 'info-red', 'info-blue');
      if (diff > 0) {
        info.textContent = `Noch ${diff} Element${diff === 1 ? '' : 'e'} ohne Platz.`;
        info.classList.add('info-red');
      } else if (diff === 0) {
        info.textContent = 'Alle Elemente haben einen Platz.';
        info.classList.add('info-green');
      } else {
        info.textContent = `Es gibt ${-diff} ${-diff !== 1 ? '' : 'Platz'}${-diff === 1 ? '' : 'Plätze'} mehr als Elemente.`;
        info.classList.add('info-blue');
      }
    }

    // Hilfsfunktion: Dropzone erstellen
    function createDropzone(field) {
      const dropzone = document.createElement('div');
      dropzone.classList.add('dropzone');
      dropzone.id = field.id;
      dropzone.setAttribute('data-max-items', field.maxItems);
      dropzone.setAttribute('data-current-items', 0);

      // Title with editable functionality
      const title = document.createElement('div');
      title.classList.add('zone-title');
      title.textContent = field.name;
      title.addEventListener('click', function() {
        // Create edit input
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'title-edit';
        input.value = title.textContent;
        input.style.width = Math.max(100, title.offsetWidth + 20) + 'px';
        
        // Handle saving on enter or blur
        function saveTitle() {
          const newTitle = input.value.trim();
          if (newTitle) {
            title.textContent = newTitle;
            // Update in fieldConfig
            const groupConfig = fieldConfig.find(f => f.id === field.id);
            if (groupConfig) {
              groupConfig.name = newTitle;
            }
          }
          if (input.parentNode) {
            input.parentNode.removeChild(input);
          }
          title.style.display = 'block';
        }
        
        input.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            saveTitle();
          } else if (e.key === 'Escape') {
            if (input.parentNode) {
              input.parentNode.removeChild(input);
            }
            title.style.display = 'block';
          }
        });
        
        input.addEventListener('blur', saveTitle);
        
        // Add input and hide title
        dropzone.insertBefore(input, title);
        title.style.display = 'none';
        input.focus();
        input.select();
      });
      dropzone.appendChild(title);

      // Delete button
      const btnDelete = document.createElement('button');
      btnDelete.textContent = '✕';
      btnDelete.type = 'button';
      btnDelete.className = 'delete-group-btn';
      btnDelete.title = 'Gruppe löschen';
      btnDelete.addEventListener('click', function () {
        // Move all items in this group back to unassigned
        Array.from(dropzone.querySelectorAll('.draggable')).forEach(item => {
          document.getElementById('draggableContainer').appendChild(item);
        });
        // Remove from fieldConfig
        fieldConfig = fieldConfig.filter(f => f.id !== field.id);
        // Remove from DOM
        dropzone.remove();
        updateGroupSpaceInfo();
      });
      dropzone.appendChild(btnDelete);

      // Size control buttons
      const sizeControls = document.createElement('div');
      sizeControls.style.marginBottom = '5px';

      const btnMinus = document.createElement('button');
      btnMinus.textContent = '–';
      btnMinus.type = 'button';
      btnMinus.style.marginRight = '2px';

      const btnPlus = document.createElement('button');
      btnPlus.textContent = '+';
      btnPlus.type = 'button';

      sizeControls.appendChild(btnMinus);
      sizeControls.appendChild(btnPlus);
      dropzone.appendChild(sizeControls);

      // Counter
      const counter = document.createElement('span');
      counter.classList.add('counter');
      counter.textContent = `0 / ${field.maxItems}`;
      dropzone.appendChild(counter);

      // Table for slots instead of slot container
      const slotTable = document.createElement('table');
      slotTable.classList.add('slot-table');
      
      // Create rows for each slot
      for (let i = 0; i < field.maxItems; i++) {
        const row = document.createElement('tr');
        row.classList.add('slot-row');
        row.dataset.slotIndex = i;
        row.dataset.empty = 'true';
        
        const cell = document.createElement('td');
        // Remove text from empty slots
        cell.textContent = '';
        
        row.appendChild(cell);
        slotTable.appendChild(row);
        
        // Add drop events to each row
        row.addEventListener('dragover', (e) => {
          e.preventDefault();
          if (row.dataset.empty === 'true') {
            row.classList.add('hover');
          }
        });
        
        row.addEventListener('dragleave', () => {
          row.classList.remove('hover');
        });
        
        row.addEventListener('drop', (e) => {
          e.preventDefault();
          const draggingItem = document.querySelector('.dragging');
          if (!draggingItem) return;
          
          const sourceZone = draggingItem.closest('.dropzone');
          const sourceRow = draggingItem.parentElement;
          
          // Only process the drop if the row is empty
          if (row.dataset.empty === 'true') {
            // Remove hover effect
            row.classList.remove('hover');
            
            // Clear row text
            row.innerHTML = '';
            
            // Mark the row as filled
            row.dataset.empty = 'false';
            row.classList.add('filled');
            
            // Move the item to this row
            row.appendChild(draggingItem);
            
            // Update counters
            if (sourceZone && sourceZone !== dropzone) {
              const sourceItems = parseInt(sourceZone.getAttribute('data-current-items'));
              sourceZone.setAttribute('data-current-items', sourceItems - 1);
              updateCounter(sourceZone);
              
              // Update source row
              if (sourceRow && sourceRow.classList.contains('slot-row')) {
                sourceRow.innerHTML = `<td></td>`;  // Empty cell with no text
                sourceRow.dataset.empty = 'true';
                sourceRow.classList.remove('filled');
              }
            } else if (sourceRow && sourceRow.classList.contains('slot-row') && sourceRow !== row) {
              sourceRow.innerHTML = `<td></td>`;  // Empty cell with no text
              sourceRow.dataset.empty = 'true';
              sourceRow.classList.remove('filled');
            }
            
            // Update target zone counter
            const currentItems = parseInt(dropzone.getAttribute('data-current-items')) + 1;
            dropzone.setAttribute('data-current-items', currentItems);
            updateCounter(dropzone);
          }
        });
      }
      
      dropzone.appendChild(slotTable);

      // Size controls logic
      btnPlus.addEventListener('click', () => {
        let maxItems = parseInt(dropzone.getAttribute('data-max-items'));
        // Find this group in fieldConfig and update its maxItems
        const group = fieldConfig.find(f => f.id === field.id);
        if (!group) return;
        
        // Allow increasing group size without restriction
        maxItems++;
        dropzone.setAttribute('data-max-items', maxItems);
        group.maxItems = maxItems;

        // Add a new row to the table
        const slotTable = dropzone.querySelector('.slot-table');
        const newRow = document.createElement('tr');
        newRow.classList.add('slot-row');
        newRow.dataset.slotIndex = maxItems - 1;
        newRow.dataset.empty = 'true';
        
        const cell = document.createElement('td');
        // Remove text from empty slot
        cell.textContent = '';
        
        newRow.appendChild(cell);
        slotTable.appendChild(newRow);
        
        // Add drop events to the new row
        newRow.addEventListener('dragover', (e) => {
          e.preventDefault();
          if (newRow.dataset.empty === 'true') {
            newRow.classList.add('hover');
          }
        });
        
        newRow.addEventListener('dragleave', () => {
          newRow.classList.remove('hover');
        });
        
        newRow.addEventListener('drop', (e) => {
          e.preventDefault();
          const draggingItem = document.querySelector('.dragging');
          if (!draggingItem) return;
          
          const sourceZone = draggingItem.closest('.dropzone');
          const sourceRow = draggingItem.parentElement;
          
          // Only process the drop if the row is empty
          if (newRow.dataset.empty === 'true') {
            // Remove hover effect
            newRow.classList.remove('hover');
            
            // Clear row text
            newRow.innerHTML = '';
            
            // Mark the row as filled
            newRow.dataset.empty = 'false';
            newRow.classList.add('filled');
            
            // Move the item to this row
            newRow.appendChild(draggingItem);
            
            // Update counters
            if (sourceZone && sourceZone !== dropzone) {
              const sourceItems = parseInt(sourceZone.getAttribute('data-current-items'));
              sourceZone.setAttribute('data-current-items', sourceItems - 1);
              updateCounter(sourceZone);
              
              // Update source row
              if (sourceRow && sourceRow.classList.contains('slot-row')) {
                sourceRow.innerHTML = `<td></td>`;  // Empty cell with no text
                sourceRow.dataset.empty = 'true';
                sourceRow.classList.remove('filled');
              }
            } else if (sourceRow && sourceRow.classList.contains('slot-row') && sourceRow !== newRow) {
              sourceRow.innerHTML = `<td></td>`;  // Empty cell with no text
              sourceRow.dataset.empty = 'true';
              sourceRow.classList.remove('filled');
            }
            
            // Update target zone counter
            const currentItems = parseInt(dropzone.getAttribute('data-current-items')) + 1;
            dropzone.setAttribute('data-current-items', currentItems);
            updateCounter(dropzone);
          }
        });

        updateCounter(dropzone);
        updateGroupSpaceInfo();
        adjustGroupHeight(dropzone);
      });

      btnMinus.addEventListener('click', () => {
        let maxItems = parseInt(dropzone.getAttribute('data-max-items'));
        let currentItems = parseInt(dropzone.getAttribute('data-current-items'));
        if (maxItems > 1 && maxItems > currentItems) {
          // Check if the last row contains an item
          const slotTable = dropzone.querySelector('.slot-table');
          const lastRow = slotTable.lastElementChild;
          
          if (lastRow && lastRow.dataset.empty === 'false') {
            // Move the item to unassigned
            const item = lastRow.querySelector('.draggable');
            if (item) {
              document.getElementById('draggableContainer').appendChild(item);
              
              // Adjust the count of items in the group
              const currentItems = parseInt(dropzone.getAttribute('data-current-items'));
              dropzone.setAttribute('data-current-items', currentItems - 1);
            }
          }
          
          // Remove the last row
          if (slotTable.lastElementChild) {
            slotTable.removeChild(slotTable.lastElementChild);
          }
          
          maxItems--;
          dropzone.setAttribute('data-max-items', maxItems);
          // Update fieldConfig for this group
          const group = fieldConfig.find(f => f.id === field.id);
          if (group) group.maxItems = maxItems;

          updateCounter(dropzone);
          updateGroupSpaceInfo();
          adjustGroupHeight(dropzone);
        }
      });

      // Drag/drop logic for dropzone container
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        // Prevent direct drops on the container (rows should handle drops)
        // This is just a fallback
        const draggingItem = document.querySelector('.dragging');
        if (!draggingItem) return;
        
        // Find the first empty row
        const emptyRow = dropzone.querySelector('.slot-row[data-empty="true"]');
        if (emptyRow) {
          // Simulate a drop on the row
          const dropEvent = new Event('drop');
          emptyRow.dispatchEvent(dropEvent);
        }
      });

      return dropzone;
    }

    // Function to adjust the height of a group based on its table rows
    function adjustGroupHeight(group) {
      const headerHeight = 60; // Reduced height for controls, title, etc.
      const table = group.querySelector('.slot-table');
      if (!table) return;
      
      const rows = table.querySelectorAll('.slot-row');
      if (rows.length === 0) return;
      
      const rowHeight = 45; // Height per row
      
      // Calculate height based on number of rows only
      const tableHeight = rows.length * rowHeight;
      
      // Calculate the minimum height needed with less padding
      group.style.height = (headerHeight + tableHeight + 10) + 'px'; // Reduced padding from 30px to 10px
    }

    // Function to adjust all groups' heights
    function adjustAllGroupHeights() {
      document.querySelectorAll('.dropzone').forEach(group => {
        adjustGroupHeight(group);
      });
    }

    // Initial Felder dynamisch hinzufügen
    function renderGroups(preservedGroupItems = null) {
      const container = document.getElementById('container');
      // Save mapping from group id to its current items (by item id)
      let groupItems;
      if (preservedGroupItems) {
        groupItems = preservedGroupItems;
      } else {
        groupItems = {};
        Array.from(container.querySelectorAll('.dropzone')).forEach(zone => {
          const groupId = zone.id;
          groupItems[groupId] = [];
          Array.from(zone.querySelectorAll('.draggable')).forEach(item => {
            groupItems[groupId].push({
              id: item.id,
              rowIndex: item.parentElement.dataset.slotIndex || 0
            });
          });
        });
      }

      // Remove only dropzones, but NOT their children (items)
      Array.from(container.querySelectorAll('.dropzone')).forEach(zone => {
        // Move all draggable items to a temporary container to preserve them
        Array.from(zone.querySelectorAll('.draggable')).forEach(item => {
          document.getElementById('draggableContainer').appendChild(item);
        });
        container.removeChild(zone);
      });

      // Now re-add dropzones
      fieldConfig.forEach(field => {
        const dropzone = createDropzone(field);
        container.appendChild(dropzone);
      });

      // After all dropzones are created, re-attach items to their groups
      Object.entries(groupItems).forEach(([groupId, items]) => {
        const dropzone = document.getElementById(groupId);
        if (dropzone) {
          items.forEach(itemData => {
            const item = document.getElementById(itemData.id);
            if (item) {
              const rowIndex = itemData.rowIndex || 0;
              const rows = dropzone.querySelectorAll('.slot-row');
              if (rows[rowIndex]) {
                rows[rowIndex].innerHTML = '';
                rows[rowIndex].appendChild(item);
                rows[rowIndex].dataset.empty = 'false';
                rows[rowIndex].classList.add('filled');
              } else if (rows.length > 0) {
                // Find first available row if specific index not found
                const firstEmptyRow = Array.from(rows).find(r => r.dataset.empty === 'true');
                if (firstEmptyRow) {
                  firstEmptyRow.innerHTML = '';
                  firstEmptyRow.appendChild(item);
                  firstEmptyRow.dataset.empty = 'false';
                  firstEmptyRow.classList.add('filled');
                }
              }
            }
          });
        }
      });

      updateGroupSpaceInfo();
      updateAllCurrentItems();
      
      // Adjust the heights after items are placed
      adjustAllGroupHeights();
    }

    function renderDraggables() {
      const draggableContainer = document.getElementById('draggableContainer');
      draggableContainer.innerHTML = '';
      
      // Get the IDs of items already placed in groups
      const assignedItemIds = new Set();
      document.querySelectorAll('.dropzone .draggable').forEach(item => {
        assignedItemIds.add(item.id);
      });
      
      // Only render items that aren't already assigned to groups
      items.forEach(item => {
        // Skip if this item is already in a group
        if (assignedItemIds.has(item.id)) {
          return;
        }
        
        const draggable = document.createElement('div');
        draggable.classList.add('draggable');
        draggable.id = item.id;

        // Create a text span for the item's content
        const textSpan = document.createElement('span');
        textSpan.textContent = item.content;
        textSpan.style.pointerEvents = 'none';
        draggable.appendChild(textSpan);

        // Delete button for item with improved styling for touch targets
        const delBtn = document.createElement('button');
        delBtn.textContent = '✕';
        delBtn.title = 'Kind löschen';
        delBtn.style.marginLeft = '8px';
        delBtn.style.background = '#ff6666';
        delBtn.style.color = 'white';
        delBtn.style.border = 'none';
        delBtn.style.borderRadius = '4px';
        delBtn.style.cursor = 'pointer';
        delBtn.style.fontSize = '14px';
        delBtn.style.float = 'right';
        delBtn.style.position = 'relative';
        delBtn.style.top = '-2px';
        delBtn.style.padding = '2px 8px'; // Larger touch target
        delBtn.style.pointerEvents = 'auto'; // Ensure button receives events

        // Stop event propagation for all relevant events
        ['click', 'touchstart', 'touchmove', 'touchend'].forEach(eventType => {
          delBtn.addEventListener(eventType, (e) => {
            e.stopPropagation();
            if (eventType === 'click' || eventType === 'touchend') {
              e.preventDefault();

              // Handle removal from slots if needed
              const slotRow = draggable.closest('.slot-row');
              const dropzone = draggable.closest('.dropzone');

              if (slotRow && dropzone) {
                // Reset the slot row
                slotRow.innerHTML = '<td></td>';
                slotRow.dataset.empty = 'true';
                slotRow.classList.remove('filled');

                // Update the dropzone counter
                const currentItems = parseInt(dropzone.getAttribute('data-current-items')) - 1;
                dropzone.setAttribute('data-current-items', currentItems);
                updateCounter(dropzone);
              }

              deleteItem(item.id);
            }
          });
        });

        draggable.appendChild(delBtn);
        draggable.setAttribute('draggable', 'true');
        draggableContainer.appendChild(draggable);
      });
      setDraggableEvents();
    }

    function deleteItem(itemId) {
      // Find the item first to handle its container properly
      const itemElement = document.getElementById(itemId);

      if (itemElement) {
        // Check if item is in a slot row
        const slotRow = itemElement.closest('.slot-row');
        const dropzone = itemElement.closest('.dropzone');

        if (slotRow && dropzone) {
          // Reset the slot row
          slotRow.innerHTML = '<td></td>';
          slotRow.dataset.empty = 'true';
          slotRow.classList.remove('filled');

          // Update counter
          const currentItems = parseInt(dropzone.getAttribute('data-current-items')) - 1;
          dropzone.setAttribute('data-current-items', Math.max(0, currentItems));
          updateCounter(dropzone);
        }
      }

      // Remove from items array
      items = items.filter(i => i.id !== itemId);

      // Remove from DOM
      if (itemElement) {
        itemElement.remove();
      }

      updateGroupSpaceInfo();
    }

    function updateAllCurrentItems() {
      // For each dropzone, recount children that are .draggable
      document.querySelectorAll('.dropzone').forEach(zone => {
        const count = zone.querySelectorAll('.draggable').length;
        zone.setAttribute('data-current-items', count);
        updateCounter(zone);
      });
    }

    renderGroups();
    renderDraggables();
    adjustAllGroupHeights();

    // Add Group Button
    document.getElementById('btn_add_group').addEventListener('click', () => {
      // Store all existing items in their groups
      const draggables = {};
      document.querySelectorAll('.draggable').forEach(item => {
        draggables[item.id] = item.parentElement.id;
      });

      // Find next available id
      let idx = 1;
      while (fieldConfig.find(f => f.id === `zone${idx}`)) idx++;
      const newField = {
        id: `zone${idx}`,
        name: `Gruppe ${idx}`,
        maxItems: 1
      };
      fieldConfig.push(newField);

      // Add the new group without touching existing ones
      const container = document.getElementById('container');
      const newDropzone = createDropzone(newField);
      container.appendChild(newDropzone);
      
      // Update the counters and info
      updateAllCurrentItems();
      updateGroupSpaceInfo();
      adjustAllGroupHeights();
    });

    // Add Item Button
    function addItemFromInput() {
      const input = document.getElementById('new_item_name');
      let name = input.value.trim();
      if (!name) {
        alert('Bitte einen Namen eingeben.');
        return;
      }
      // Ensure unique id
      let idx = 1;
      let id;
      do {
        id = `item${items.length + idx}`;
        idx++;
      } while (items.find(i => i.id === id));
      items.push({ id, content: name });
      renderDraggables();
      updateGroupSpaceInfo();
      input.value = '';
    }

    document.getElementById('btn_add_item').addEventListener('click', addItemFromInput);

    document.getElementById('new_item_name').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        addItemFromInput();
      }
    });

    // Draggable Items dynamisch hinzufügen (handled by renderDraggables now)

    // Dragging Logik
    function setDraggableEvents() {
      const draggables = document.querySelectorAll('.draggable');
      draggables.forEach(draggable => {
        // Mouse drag events
        draggable.addEventListener('dragstart', () => {
          draggable.classList.add('dragging');
          
          // Update the row when dragging starts
          const parentRow = draggable.parentElement;
          if (parentRow && parentRow.classList.contains('slot-row')) {
            parentRow.dataset.dragging = 'true';
          }
        });
        
        draggable.addEventListener('dragend', () => {
          draggable.classList.remove('dragging');
          
          // Update the parent row when drag ends
          const parentRow = draggable.parentElement;
          if (parentRow) {
            if (parentRow.classList.contains('slot-row')) {
              parentRow.dataset.dragging = 'false';
            }
          }
          
          // Adjust heights of all groups after drag ends
          adjustAllGroupHeights();
        });

        // Add touch event support
        draggable.addEventListener('touchstart', handleTouchStart, { passive: false });
        draggable.addEventListener('touchmove', handleTouchMove, { passive: false });
        draggable.addEventListener('touchend', handleTouchEnd, { passive: false });
      });
    }

    // Touch event handling variables
    let touchDragging = false;
    let currentTouchElement = null;
    let touchOffsetX = 0;
    let touchOffsetY = 0;
    let originalPosition = { parent: null, nextSibling: null };
    
    // Handle touch start event
    function handleTouchStart(e) {
      e.preventDefault(); // Prevent scrolling when starting to drag
      
      const touch = e.touches[0];
      const draggable = e.currentTarget;
      
      // Store the element being touched
      currentTouchElement = draggable;
      
      // Calculate touch offset relative to the element
      const rect = draggable.getBoundingClientRect();
      touchOffsetX = touch.clientX - rect.left;
      touchOffsetY = touch.clientY - rect.top;
      
      // Store original position for potential cancel
      originalPosition = {
        parent: draggable.parentNode,
        nextSibling: draggable.nextElementSibling
      };
      
      // Apply dragging class and style
      draggable.classList.add('dragging');
      draggable.style.position = 'fixed';
      draggable.style.zIndex = '1000';
      draggable.style.opacity = '0.8';
      
      // Mark touch dragging as active
      touchDragging = true;
      
      // Update the row when dragging starts
      const parentRow = draggable.parentElement;
      if (parentRow && parentRow.classList.contains('slot-row')) {
        parentRow.dataset.dragging = 'true';
        parentRow.dataset.empty = 'true';
        parentRow.classList.remove('filled');
      }
      
      // Move element to document body for unrestricted movement
      document.body.appendChild(draggable);
      
      // Position at the touch point accounting for the offset
      positionElementAtTouch(touch, draggable);
    }

    // Position element at touch location accounting for offset
    function positionElementAtTouch(touch, element) {
      element.style.left = (touch.clientX - touchOffsetX) + 'px';
      element.style.top = (touch.clientY - touchOffsetY) + 'px';
    }
    
    // Handle touch move event
    function handleTouchMove(e) {
      e.preventDefault(); // Prevent scrolling during drag
      
      if (!touchDragging || !currentTouchElement) return;
      
      const touch = e.touches[0];
      
      // Move the element with the touch
      positionElementAtTouch(touch, currentTouchElement);
      
      // Find the element under the touch point for drop targeting
      const dropTarget = getTouchDropTarget(touch);
      
      // Reset hover state on all potential drop targets
      document.querySelectorAll('.slot-row').forEach(row => {
        row.classList.remove('hover');
      });
      
      // If over a valid drop target, highlight it
      if (dropTarget && dropTarget.classList.contains('slot-row') && dropTarget.dataset.empty === 'true') {
        dropTarget.classList.add('hover');
      }
    }
    
    // Find a drop target under the touch point
    function getTouchDropTarget(touch) {
      // Hide the dragged element temporarily to get accurate elementFromPoint
      if (currentTouchElement) {
        currentTouchElement.style.visibility = 'hidden';
      }
      
      // Get the element at touch position
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      
      // Make the dragged element visible again
      if (currentTouchElement) {
        currentTouchElement.style.visibility = 'visible';
      }
      
      // For slot rows, return the row itself
      if (element && element.classList && element.classList.contains('slot-row')) {
        return element;
      }
      
      // For cells inside rows, return the row
      if (element && element.tagName === 'TD') {
        return element.parentElement;
      }
      
      // For the draggable container, return it
      if (element && element.id === 'draggableContainer') {
        return element;
      }
      
      // For other elements, try to find a slot row or draggable container as parent
      let parent = element;
      while (parent) {
        if (parent.classList && parent.classList.contains('slot-row')) {
          return parent;
        }
        if (parent.id === 'draggableContainer') {
          return parent;
        }
        parent = parent.parentElement;
      }
      
      return null;
    }
    
    // Handle touch end event
    function handleTouchEnd(e) {
      e.preventDefault();
      
      if (!touchDragging || !currentTouchElement) return;
      
      // Find drop target at the last touch position
      const touch = e.changedTouches[0];
      const dropTarget = getTouchDropTarget(touch);
      
      // Reset element styles
      currentTouchElement.style.position = '';
      currentTouchElement.style.left = '';
      currentTouchElement.style.top = '';
      currentTouchElement.style.zIndex = '';
      currentTouchElement.style.opacity = '';
      currentTouchElement.classList.remove('dragging');
      
      // Handle drop based on target
      if (dropTarget) {
        if (dropTarget.classList.contains('slot-row') && dropTarget.dataset.empty === 'true') {
          // Drop into a slot row
          handleDropIntoSlotRow(dropTarget, currentTouchElement);
        } else if (dropTarget.id === 'draggableContainer') {
          // Drop back into the draggable container
          dropTarget.appendChild(currentTouchElement);
          
          // If it came from a slot row, update that row
          if (originalPosition.parent && originalPosition.parent.classList.contains('slot-row')) {
            updateSourceRowAfterDrag(originalPosition.parent);
          }
        } else {
          // Invalid drop target, return to original position
          returnToOriginalPosition();
        }
      } else {
        // No drop target found, return to original position
        returnToOriginalPosition();
      }
      
      // Reset hover state on all drop targets
      document.querySelectorAll('.slot-row').forEach(row => {
        row.classList.remove('hover');
      });
      
      // Reset touch tracking variables
      touchDragging = false;
      currentTouchElement = null;
      
      // Update counters and adjust heights
      updateAllCurrentItems();
      adjustAllGroupHeights();
    }
    
    // Handle dropping an element into a slot row
    function handleDropIntoSlotRow(row, element) {
      // Clear the row
      row.innerHTML = '';
      
      // Mark the row as filled
      row.dataset.empty = 'false';
      row.classList.add('filled');
      row.classList.remove('hover');
      
      // Add the item to the row
      row.appendChild(element);
      
      // If the element came from another slot row, update that row
      if (originalPosition.parent && originalPosition.parent.classList.contains('slot-row')) {
        updateSourceRowAfterDrag(originalPosition.parent);
      }
      
      // Update dropzone counter
      const dropzone = row.closest('.dropzone');
      if (dropzone) {
        const sourceZone = originalPosition.parent ? originalPosition.parent.closest('.dropzone') : null;
        
        // If moving from one zone to another, decrement source counter
        if (sourceZone && sourceZone !== dropzone) {
          const sourceItems = parseInt(sourceZone.getAttribute('data-current-items')) - 1;
          sourceZone.setAttribute('data-current-items', Math.max(0, sourceItems));
          updateCounter(sourceZone);
        }
        
        // Update target zone counter
        const currentItems = parseInt(dropzone.getAttribute('data-current-items')) + 1;
        dropzone.setAttribute('data-current-items', currentItems);
        updateCounter(dropzone);
      }
    }
    
    // Update a source row after an element has been dragged out
    function updateSourceRowAfterDrag(row) {
      if (!row) return;
      
      // Reset the source row
      row.innerHTML = '<td></td>';
      row.dataset.empty = 'true';
      row.classList.remove('filled');
      row.dataset.dragging = 'false';
    }
    
    // Return dragged element to its original position
    function returnToOriginalPosition() {
      if (!currentTouchElement) return;
      
      if (originalPosition.parent) {
        if (originalPosition.nextSibling) {
          originalPosition.parent.insertBefore(currentTouchElement, originalPosition.nextSibling);
        } else {
          originalPosition.parent.appendChild(currentTouchElement);
        }
        
        // If returning to a slot row, make sure it's marked as filled
        if (originalPosition.parent.classList.contains('slot-row')) {
          originalPosition.parent.dataset.empty = 'false';
          originalPosition.parent.classList.add('filled');
          originalPosition.parent.dataset.dragging = 'false';
        }
      } else {
        // If no original parent (shouldn't happen), add to unassigned area
        document.getElementById('draggableContainer').appendChild(currentTouchElement);
      }
    }

    // Rückgabe von Items in den ursprünglichen Bereich ermöglichen
    const draggableArea = document.getElementById('draggableContainer');
    draggableArea.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    draggableArea.addEventListener('drop', (e) => {
      e.preventDefault();
      const draggingItem = document.querySelector('.dragging');
      if (!draggingItem) return;
      
      const parentRow = draggingItem.parentElement;
      const currentZone = parentRow && parentRow.closest('.dropzone');
      
      if (currentZone && parentRow.classList.contains('slot-row')) {
        // Update row to show it's empty - without text
        parentRow.innerHTML = `<td></td>`;
        parentRow.dataset.empty = 'true';
        parentRow.classList.remove('filled');
        
        // Update zone counter
        const currentItems = parseInt(currentZone.getAttribute('data-current-items'));
        currentZone.setAttribute('data-current-items', currentItems - 1);
        updateCounter(currentZone);
      }
      
      draggableArea.appendChild(draggingItem);
      updateAllCurrentItems();
    });

    // Funktion zum Aktualisieren der Anzeige und der Slots
    function updateCounter(zone) {
      const currentItems = parseInt(zone.getAttribute('data-current-items'));
      const maxItems = parseInt(zone.getAttribute('data-max-items'));
      const counter = zone.querySelector('.counter');
      
      counter.textContent = `${currentItems} / ${maxItems}`;
      
      // Wenn das Feld voll ist, Hintergrundfarbe ändern
      if (currentItems >= maxItems) {
        zone.classList.add('full');
      } else {
        zone.classList.remove('full');
      }
    }

    // Anpassung für Reset: Nach renderGroups() und renderDraggables() aufrufen
    document.getElementById('btn_reset').addEventListener('click', () => {
      document.querySelectorAll('.draggable').forEach(item => {
        document.getElementById('draggableContainer').appendChild(item);
      });
      renderGroups();
      renderDraggables();
      updateAllCurrentItems();
      updateGroupSpaceInfo();
      adjustAllGroupHeights();
    });

    // Function to download data to a file
    function download(data, filename, type) {
      var file = new Blob([data], {type: type});
      if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
      else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 0);
      }
    }

    function getCurrentConfiguration() {
      const config = {};
      // For each dropzone (group)
      document.querySelectorAll('.dropzone').forEach(zone => {
        const groupName = zone.querySelector('.zone-title').textContent;
        config[groupName] = [];
        zone.querySelectorAll('.draggable').forEach(item => {
          // Remove delete button text
          let name = item.childNodes[0].nodeType === 3 ? item.childNodes[0].textContent.trim() : item.textContent.trim();
          if (name.endsWith('✕')) name = name.slice(0, -1).trim();
          config[groupName].push(name);
        });
      });
      // Unassigned items
      config['Unassigned'] = [];
      document.querySelectorAll('#draggableContainer .draggable').forEach(item => {
        let name = item.childNodes[0].nodeType === 3 ? item.childNodes[0].textContent.trim() : item.textContent.trim();
        if (name.endsWith('✕')) name = name.slice(0, -1).trim();
        config['Unassigned'].push(name);
      });

      // Add meta information about groups
      config['_meta'] = {
        groupCount: fieldConfig.length,
        groups: fieldConfig.map(f => ({
          id: f.id,
          name: f.name,
          size: f.maxItems
        }))
      };

      return config;
    }

    // Download as text
    document.getElementById('btn_download_text').addEventListener('click', () => {
      // Get current configuration
      const config = getCurrentConfiguration();
      let textOutput = '';

      // Format each group and its items
      Object.keys(config).forEach(groupName => {
        // Skip meta information and empty groups
        if (groupName === '_meta' || config[groupName].length === 0) return;

        // Add group name and its items
        textOutput += `${groupName}:\n\t${config[groupName].join('\n\t')}\n\n`;
      });

      // Download as text file
      download(textOutput, 'group_data.txt', 'text/plain');
    });

    // Load configuration from file
    document.getElementById('btn_load').addEventListener('click', () => {
      document.getElementById('configFile').click();
    });

    document.getElementById('configFile').addEventListener('change', function(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const config = JSON.parse(e.target.result);
          loadConfiguration(config);
        } catch (err) {
          alert('Invalid configuration file.');
        }
        event.target.value = '';
      };
      reader.readAsText(file);
    });

    function loadConfiguration(config) {
      // Rebuild items array from config
      let allNames = [];
      Object.keys(config).forEach(group => {
        if (group !== '_meta') {
          allNames = allNames.concat(config[group]);
        }
      });
      items = allNames
        .filter((name, idx, arr) => arr.indexOf(name) === idx)
        .map((name, idx) => ({ id: `item${idx + 1}`, content: name }));

      // Set fieldConfig to match loaded groups
      fieldConfig = [];
      if (config._meta && Array.isArray(config._meta.groups)) {
        // Use meta group info if present
        config._meta.groups.forEach(g => {
          fieldConfig.push({
            id: g.id,
            name: g.name,
            maxItems: g.size
          });
        });
      } else {
        // Fallback: infer from config
        Object.keys(config).forEach((group, idx) => {
          if (group === 'Unassigned' || group === '_meta') return;
          fieldConfig.push({
            id: `zone${idx + 1}`,
            name: group,
            maxItems: config[group].length > 0 ? config[group].length : 3
          });
        });
      }
      renderGroups();
      renderDraggables();

      // Assign items to groups
      if (config._meta && Array.isArray(config._meta.groups)) {
        config._meta.groups.forEach((g, idx) => {
          const zone = document.querySelectorAll('.dropzone')[idx];
          if (!zone) return;
          
          const rows = zone.querySelectorAll('.slot-row');
          let rowIndex = 0;
          
          if (config[g.name]) {
            config[g.name].forEach(name => {
              const item = Array.from(document.querySelectorAll('.draggable'))
                .find(d => d.childNodes[0].nodeType === 3
                  ? d.childNodes[0].textContent.trim() === name
                  : d.textContent.trim().replace('✕', '').trim() === name
                );
              
              if (item && rowIndex < rows.length) {
                // Clear the row first
                rows[rowIndex].innerHTML = '';
                
                // Add the item to the row
                rows[rowIndex].appendChild(item);
                rows[rowIndex].dataset.empty = 'false';
                rows[rowIndex].classList.add('filled');
                
                rowIndex++;
              }
            });
          }
          
          zone.setAttribute('data-current-items', rowIndex);
          updateCounter(zone);
        });
      } else {
        Object.keys(config).forEach((group, idx) => {
          if (group === 'Unassigned' || group === '_meta') return;
          
          const zone = document.querySelectorAll('.dropzone')[idx];
          if (!zone) return;
          
          const rows = zone.querySelectorAll('.slot-row');
          let rowIndex = 0;
          
          config[group].forEach(name => {
            const item = Array.from(document.querySelectorAll('.draggable'))
              .find(d => d.childNodes[0].nodeType === 3
                ? d.childNodes[0].textContent.trim() === name
                : d.textContent.trim().replace('✕', '').trim() === name
              );
            
            if (item && rowIndex < rows.length) {
              // Clear the row first
              rows[rowIndex].innerHTML = '';
              
              // Add the item to the row
              rows[rowIndex].appendChild(item);
              rows[rowIndex].dataset.empty = 'false';
              rows[rowIndex].classList.add('filled');
              
              rowIndex++;
            }
          });
          
          zone.setAttribute('data-current-items', rowIndex);
          updateCounter(zone);
        });
      }

      // Place remaining items in unassigned area
      if (config['Unassigned']) {
        config['Unassigned'].forEach(name => {
          const item = Array.from(document.querySelectorAll('.draggable'))
            .find(d => d.childNodes[0].nodeType === 3
              ? d.childNodes[0].textContent.trim() === name
              : d.textContent.trim().replace('✕', '').trim() === name
            );
          if (item) {
            document.getElementById('draggableContainer').appendChild(item);
          }
        });
      }
      
      updateAllCurrentItems();
      updateGroupSpaceInfo();
      
      // Adjust heights after loading configuration
      setTimeout(adjustAllGroupHeights, 50);
    }

    // Event Listener für den Download Button
    document.getElementById('btn_download').addEventListener('click', () => {
      const data = JSON.stringify(getCurrentConfiguration(), null, 2);
      download(data, 'group_data.json', 'application/json');
    });

    // Random distribute button - updated for table rows
    document.getElementById('btn_random_distribute').addEventListener('click', function() {
      // Gather all items (both assigned and unassigned)
      const allItems = [];
      
      // Collect items from all groups
      document.querySelectorAll('.dropzone .draggable').forEach(item => {
        allItems.push(item);
      });
      
      // Collect unassigned items
      document.querySelectorAll('#draggableContainer .draggable').forEach(item => {
        allItems.push(item);
      });
      
      // First, move all items to unassigned area
      allItems.forEach(item => {
        document.getElementById('draggableContainer').appendChild(item);
      });
      
      // Reset all rows to empty
      document.querySelectorAll('.slot-row').forEach(row => {
        row.innerHTML = `<td></td>`;  // Empty cell with no text
        row.dataset.empty = 'true';
        row.classList.remove('filled');
      });
      
      // Reset all dropzone counters
      document.querySelectorAll('.dropzone').forEach(zone => {
        zone.setAttribute('data-current-items', '0');
        updateCounter(zone);
      });
      
      // Shuffle the items
      for (let i = allItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allItems[i], allItems[j]] = [allItems[j], allItems[i]];
      }
      
      // Get all empty rows from all groups
      const allRows = Array.from(document.querySelectorAll('.slot-row'));
      
      // Shuffle the rows order to randomize placement
      for (let i = allRows.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allRows[i], allRows[j]] = [allRows[j], allRows[i]];
      }
      
      // Assign items to random rows until we run out of items or rows
      const itemsToAssign = Math.min(allItems.length, allRows.length);
      
      for (let i = 0; i < itemsToAssign; i++) {
        // Clear the row
        allRows[i].innerHTML = '';
        
        // Add item to row
        allRows[i].appendChild(allItems[i]);
        allRows[i].dataset.empty = 'false';
        allRows[i].classList.add('filled');
        
        // Update counter of parent dropzone
        const parentZone = allRows[i].closest('.dropzone');
        const currentItems = parseInt(parentZone.getAttribute('data-current-items')) + 1;
        parentZone.setAttribute('data-current-items', currentItems);
        updateCounter(parentZone);
      }
      
      // Update all counters and info
      updateAllCurrentItems();
      
      // Make sure to adjust heights with a slight delay to ensure DOM is updated
      setTimeout(adjustAllGroupHeights, 50);
    });

    // Create equal groups button - updated for table rows
    document.getElementById('btn_create_equal_groups').addEventListener('click', function() {
      const groupCount = parseInt(document.getElementById('group_count').value);
      
      if (isNaN(groupCount) || groupCount < 1) {
        alert('Bitte geben Sie eine positive Zahl ein.');
        return;
      }
      
      // Gather all items (both assigned and unassigned)
      const allItems = [];
      
      // Collect items from all groups
      document.querySelectorAll('.dropzone .draggable').forEach(item => {
        allItems.push(item);
      });
      
      // Collect unassigned items
      document.querySelectorAll('#draggableContainer .draggable').forEach(item => {
        allItems.push(item);
      });
      
      if (allItems.length === 0) {
        alert('Es gibt keine Elemente zum Verteilen.');
        return;
      }
      
      // Calculate exact group sizes to fit all items perfectly
      const baseSize = Math.floor(allItems.length / groupCount);
      const remainder = allItems.length % groupCount;
      
      // Clear current groups
      fieldConfig = [];
      
      // Create new groups with optimal sizes
      for (let i = 1; i <= groupCount; i++) {
        // Add one extra slot to some groups if we have a remainder
        const extraItem = i <= remainder ? 1 : 0;
        fieldConfig.push({
          id: `zone${i}`,
          name: `Gruppe ${i}`,
          maxItems: baseSize + extraItem
        });
      }
      
      // First, move all items to unassigned area
      allItems.forEach(item => {
        document.getElementById('draggableContainer').appendChild(item);
      });
      
      // Re-render the groups
      renderGroups();
      
      // Shuffle the items
      for (let i = allItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allItems[i], allItems[j]] = [allItems[j], allItems[i]];
      }
      
      // Get all rows from newly created groups
      const allRows = Array.from(document.querySelectorAll('.slot-row'));
      
      // Distribute items to rows in order
      const itemsToAssign = Math.min(allItems.length, allRows.length);
      
      for (let i = 0; i < itemsToAssign; i++) {
        // Clear the row
        allRows[i].innerHTML = '';
        
        // Add item to row
        allRows[i].appendChild(allItems[i]);
        allRows[i].dataset.empty = 'false';
        allRows[i].classList.add('filled');
        
        // Update counter of parent dropzone
        const parentZone = allRows[i].closest('.dropzone');
        const currentItems = parseInt(parentZone.getAttribute('data-current-items')) + 1;
        parentZone.setAttribute('data-current-items', currentItems);
        updateCounter(parentZone);
      }
      
      // Update all counters and info
      updateAllCurrentItems();
      updateGroupSpaceInfo();
      
      // Make sure to adjust heights with a slight delay to ensure DOM is updated
      setTimeout(adjustAllGroupHeights, 50);
    });

    // Create groups of specific size button - updated for table rows
    document.getElementById('btn_create_size_groups').addEventListener('click', function() {
      const groupSize = parseInt(document.getElementById('group_count').value);
      
      if (isNaN(groupSize) || groupSize < 1) {
        alert('Bitte geben Sie eine positive Zahl ein.');
        return;
      }
      
      // Gather all items (both assigned and unassigned)
      const allItems = [];
      
      // Collect items from all groups
      document.querySelectorAll('.dropzone .draggable').forEach(item => {
        allItems.push(item);
      });
      
      // Collect unassigned items
      document.querySelectorAll('#draggableContainer .draggable').forEach(item => {
        allItems.push(item);
      });
      
      if (allItems.length === 0) {
        alert('Es gibt keine Elemente zum Verteilen.');
        return;
      }
      
      // Calculate how many groups we need
      const groupCount = Math.ceil(allItems.length / groupSize);
      
      // Clear current groups
      fieldConfig = [];
      
      // Create groups of requested size, last one might be smaller
      for (let i = 1; i <= groupCount; i++) {
        const isLastGroup = i === groupCount;
        const remainingItems = allItems.length - (i - 1) * groupSize;
        const thisGroupSize = isLastGroup ? Math.min(groupSize, remainingItems) : groupSize;
        
        fieldConfig.push({
          id: `zone${i}`,
          name: `Gruppe ${i}`,
          maxItems: thisGroupSize
        });
      }
      
      // First, move all items to unassigned area
      allItems.forEach(item => {
        document.getElementById('draggableContainer').appendChild(item);
      });
      
      // Re-render the groups
      renderGroups();
      
      // Shuffle the items
      for (let i = allItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allItems[i], allItems[j]] = [allItems[j], allItems[i]];
      }
      
      // Get all rows from newly created groups
      const allRows = Array.from(document.querySelectorAll('.slot-row'));
      
      // Distribute items to rows in order
      const itemsToAssign = Math.min(allItems.length, allRows.length);
      
      for (let i = 0; i < itemsToAssign; i++) {
        // Clear the row
        allRows[i].innerHTML = '';
        
        // Add item to row
        allRows[i].appendChild(allItems[i]);
        allRows[i].dataset.empty = 'false';
        allRows[i].classList.add('filled');
        
        // Update counter of parent dropzone
        const parentZone = allRows[i].closest('.dropzone');
        const currentItems = parseInt(parentZone.getAttribute('data-current-items')) + 1;
        parentZone.setAttribute('data-current-items', currentItems);
        updateCounter(parentZone);
      }
      
      // Update all counters and info
      updateAllCurrentItems();
      updateGroupSpaceInfo();
      
      // Make sure to adjust heights with a slight delay to ensure DOM is updated
      setTimeout(adjustAllGroupHeights, 50);
    });

    // Add window resize event to readjust heights when window size changes
    window.addEventListener('resize', adjustAllGroupHeights);

    // ---------- TourGuide JS ----------
    tourSteps = [
      {
        content: `<p>Der Button fügt eine Gruppe hinzu.</p>
          <p>Gruppen können</p>
          <ul>
            <li>mit den Plus- und Minus-Buttons um Plätze erweitert oder reduziert werden.</li>
            <li>mit Klick auf den Gruppennamen umbenannt werden.</li>
            <li>mit Klick auf den x-Button gelöscht werden. Beinhaltete Elemente wandern dann wieder in den Bereich für nicht zugewiesene Elemente.</li>
          </ul>`,
        title: "Gruppen",
        target: "#btn_add_group",
        order: 1
      },
      {
        content: `<p>Hier können neue Elemente erstellt werden.</p>`,
        title: "Elemente",
        target: "#new_item_name",
        order: 2
      },
      {
        content: `<p>Neu erstellte Elemente landen zunächst hier und können dann in die Gruppen und zwischen den Gruppen hin- und herverschoben werden. Bei Bedarf können sie auch wieder hier abgelegt werden.</p>
        <p>Mit einem Klick auf das x können sie auch wieder gelöscht werden.</p>`,
        title: "Neue Elemente",
        target: "#draggableContainer",
        order: 3
      },
      {
        content: `<p>Hier werden Informationen zum Verhältnis zwischen Elementen und vorhandenen Gruppenplätzen angezeigt.</p>`,
        title: "Infobereich",
        target: "#group_space_info",
        order: 4
      },
      {
        content: `<p>Mit diesen Buttons können die Elemente per Zufall Gruppen zugeordnet werden.</p>
        <ul>
          <li>Der erste Button verteilt die Elemente in die erstellten Gruppen. Anzahl und Größe der Gruppen werden nicht verändert. Sollten mehr Elemente vorhanden sein als Platz in den Gruppen, so werden einige Elemente nicht zugeordnet.</li>
          <li>Der zweite Button legt so viele Gruppen an, wie im Auswahlfeld angegeben werden, und verteilt alle Elemente gleichmäßig auf diese Gruppen.</li>
          <li>Der dritte Button legt so viele Gruppen wie nötig an, um alle Elemente auf Gruppen der im Eingabefeld angegebenen Gruppengröße zu verteilen, und verteilt die Elemente per Zufall.</li>
        </ul>`,
        title: "Zufällige Verteilung (optional)",
        target: "#random_buttons",
        order: 5
      },
      {
        content: `<p>Dieser Button bewegt alle Elemente zurück in den Bereich für nicht zugewiesene Elemente. Die Gruppenstruktur bleibt erhalten.</p>
        <p>Um ganz von vorne anzufangen, also ohne Gruppen und Elemente, kann man einfach die Seite neu laden.</p>`,
        title: "Zurücksetzen",
        target: "#btn_reset",
        order: 6
      },
      {
        content: `<p>Der Button "Speichern" speichert den aktuellen Stand in einer Datei. Mit dem Button "Laden" kann dieser später wiederhergestellt werden, um daran weiterzuarbeiten.</p>`,
        title: "Speichern und Laden",
        target: "#saveAndLoad",
        order: 7
      },
      {
        content: `<p>Dieser Button lädt eine einfache Textdatei herunter, die die aktuelle Gruppeneinteilung beinhaltet. Diese Datei kann später nicht wieder geladen werden, sieht aber etwas schöner aus.</p>`,
        title: "Textdatei runterladen",
        target: "#btn_download_text",
        order: 8
      }
    ]
    const tg = new tourguide.TourGuideClient({
      exitOnClickOutside: false,
      steps: tourSteps,
      dialogClass: "tourDialog",
      prevLabel: "Zurück",
      nextLabel: "Weiter",
      finishLabel: "Fertig"
    })
    document.getElementById('btn_help').addEventListener('click', () => {tg.start()});
