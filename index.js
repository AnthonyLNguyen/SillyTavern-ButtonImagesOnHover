import { SlashCommandParser } from '../../../slash-commands/SlashCommandParser.js';
import { resolveVariable } from '../../../variables.js';
import { ARGUMENT_TYPE, SlashCommandArgument, SlashCommandNamedArgument } from '../../../slash-commands/SlashCommandArgument.js';
import { SlashCommand } from '../../../slash-commands/SlashCommand.js';
import { POPUP_TYPE, Popup } from '../../../popup.js';

async function buttonsImageCallback(args, text) {
  try {
      /** @type {string[]} */
      const buttons = JSON.parse(resolveVariable(args?.labels));

      if (!Array.isArray(buttons) || !buttons.length) {
          console.warn('WARN: Invalid labels provided for /buttons command');
          return '';
      }

      // Map custom buttons to results. Start at 2 because 1 and 0 are reserved for ok and cancel
      const resultToButtonMap = new Map(buttons.map((button, index) => [index + 2, button]));

      return new Promise(async (resolve) => {
          const safeValue = DOMPurify.sanitize(text || '');

          /** @type {Popup} */
          let popup;

          const buttonContainer = document.createElement('div');
          buttonContainer.classList.add('flex-container', 'flexFlowColumn', 'wide100p');

          const scrollableContainer = document.createElement('div');
          scrollableContainer.classList.add('scrollable-buttons-container');

          for (const [result, button] of resultToButtonMap) {
              const buttonElement = document.createElement('div');
              const imageElement = document.createElement('img');
              imageElement.src = 'assets/button-images/' + button + '.png';
              imageElement.alt = 'image';
              imageElement.classList.add('tooltip','n');
              buttonElement.classList.add('menu_button', 'result-control', 'wide100p', 'hover_img');
              buttonElement.dataset.result = String(result);
              buttonElement.addEventListener('click', async () => {
                  await popup.complete(result);
              });
              buttonElement.innerText = button;
              buttonElement.appendChild(imageElement);
              buttonContainer.appendChild(buttonElement);
          }

          scrollableContainer.appendChild(buttonContainer);

          const popupContainer = document.createElement('div');
          popupContainer.innerHTML = safeValue;
          popupContainer.appendChild(scrollableContainer);

          // Ensure the popup uses flex layout
          popupContainer.style.display = 'flex';
          popupContainer.style.flexDirection = 'column';
          popupContainer.style.maxHeight = '80vh'; // Limit the overall height of the popup

          popup = new Popup(popupContainer, POPUP_TYPE.TEXT, '', { okButton: 'Cancel', allowVerticalScrolling: true });
          popup.show()
              .then((result => resolve(typeof result === 'number' ? resultToButtonMap.get(result) ?? '' : '')))
              .catch(() => resolve(''));
      });
  } catch {
      return '';
  }
}

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'buttonsImage',
  name: 'buttonsImage',
  callback: buttonsImageCallback,
  aliases: ['buttons-image'],
  returns: 'clicked button label',
  namedArgumentList: [
      SlashCommandNamedArgument.fromProps({ name: 'labels',
          description: 'button labels',
          typeList: ARGUMENT_TYPE.LIST,
          isRequired: true,
      }),
  ],
  unnamedArgumentList: [
      SlashCommandArgument.fromProps({ description: 'text',
          typeList: ARGUMENT_TYPE.STRING,
          isRequired: true,
      }),
  ],
  helpString: `
        <div>
            Shows a blocking popup with the specified text and buttons.
            Returns the clicked button label into the pipe or empty string if canceled.
        </div>
        <div>
            <strong>Example:</strong>
            <ul>
                <li>
                    <pre><code>/buttons labels=["Yes","No"] Do you want to continue?</code></pre>
                </li>
            </ul>
        </div>
  `,
}));