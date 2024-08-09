/*
 * SPDX-License-Identifier: GPL-3.0
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2023 Vendicated and Vencord contributors
 */

import { BrowserWindow, Input } from "electron";

export function initVimMode(win: BrowserWindow) {
    const vim = new VimBind(win);

    // Bind key events
    win.webContents.on("before-input-event", (event, input) => {
        if (input.type === "keyDown") {
            const key = input.key.toLowerCase();

            if (vim.labelMode) {
                if (key === "escape") {
                    console.log("exiting Label Mode");

                    vim.labelModeOff;
                    vim.keyBuffer = "";
                    vim.labelMode = false;
                }

                try {
                    vim.keyBuffer += key;
                    console.log("keyBuffer: ", vim.keyBuffer);
                    win.webContents.executeJavaScript(`
            (function() {
                const el = document.querySelector('[data-vim-label="${vim.keyBuffer}"]');
                if (el) {
                    el.click();
                }
            })();
        `);

                    event.preventDefault();
                    if (vim.keyBuffer.length >= 2) {
                        vim.labelModeOff();
                        vim.keyBuffer = "";
                    }
                } catch (error) {
                    console.log(error);
                }
                // event.preventDefault();
                // vim.labelMode = false;
            } else if (key in vim.keyMap) {
                vim.keyMap[key]();
                event.preventDefault();
            } else {
                console.log("error");
            }
        }
    });
}

class VimBind {
    win: BrowserWindow;
    keyMap: Record<string, () => void>;
    keyBuffer: string;
    SCROLL_STEP = 25;
    labelMode: boolean;

    constructor(win: BrowserWindow) {
        this.win = win;
        this.keyMap = {
            j: () => {
                this.scrollContent(0, this.SCROLL_STEP);
            },
            k: () => {
                this.scrollContent(0, -this.SCROLL_STEP);
            },
            h: () => {
                this.scrollContent(-this.SCROLL_STEP, 0);
            },
            l: () => {
                this.scrollContent(this.SCROLL_STEP, 0);
            },
            u: () => {
                this.scrollContent(0, -this.SCROLL_STEP * 4);
            },
            d: () => {
                this.scrollContent(0, this.SCROLL_STEP * 4);
            },
            shiftg: () => {
                this.scrollToEnd();
            },
            gg: () => {
                this.scrollToTop();
            },
            f: () => {
                this.labelModeOn();
            }
        };
        this.keyBuffer = "";
        this.labelMode = false;
        this.loadJavascript();
    }

    private loadJavascript() {
        this.win.webContents.executeJavaScript(
            `
        `
        );
    }

    scrollContent(x: number, y: number) {
        this.win.webContents.executeJavaScript(`
            scrollElement = document.querySelector(".scroller_e2e187");
            scrollElement.scrollBy(${x}, ${y});
        `);
    }

    scrollToEnd() {
        this.win.webContents.executeJavaScript(`
            scrollElement.scrollTop = scrollElement.scrollHeight;
        `);
    }

    scrollToTop() {
        this.win.webContents.executeJavaScript(`
            scrollElement.scrollTop = 0;
        `);
    }

    labelModeOn() {
        this.showClickableLabels();
        this.labelMode = true;
    }

    labelModeOff() {
        this.hideClickableLabels();
        this.labelMode = false;
    }

    showClickableLabels() {
        this.win.webContents.executeJavaScript(`

            clickableElements = document.querySelectorAll("button, a, [role='button'], [role='listitem'], [class='link_c91bad']");
            console.log(clickableElements);
            labels = 'abcdefghijklmnopqrstuvwxyz';
            labelIndex = 0;

            // Helper function to generate labels in a base-26 manner
            function generateLabel(index) {
                const labels = 'abcdefghijklmnopqrstuvwxyz';
                let label = '';
                while (index >= 0) {
                    label = labels[index % 26] + label;
                    index = Math.floor(index / 26) - 1;
                }
                // Ensure the label is at least 2 characters long
                while (label.length < 2) {
                    label = labels[0] + label;
                }
                return label;
            }

            clickableElements.forEach((el, index) => {

                const label = generateLabel(index)
                labelIndex += 2;

                const span = document.createElement('span');
                span.textContent = label;
                span.className = 'vim-label';
                span.style.position = 'absolute';
                span.style.backgroundColor = 'yellow';
                span.style.color = 'black';
                span.style.fontSize = '12px';
                span.style.padding = '2px';
                span.style.borderRadius = '2px';
                span.style.zIndex = '9999';

                const rect = el.getBoundingClientRect();
                span.style.left = \`\${rect.left + window.scrollX}px\`;
                span.style.top = \`\${rect.top + window.scrollY}px\`;

                document.body.appendChild(span);

                el.dataset.vimLabel = label;
                el.addEventListener('click', () => {
                    span.remove();
                });
            });

        `);
    }

    hideClickableLabels() {
        this.win.webContents.executeJavaScript(`
            document.querySelectorAll('.vim-label').forEach(label => label.remove());
        `);
    }

    handleKeyboardEvent(event: any, input: Input) {}
}
