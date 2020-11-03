import styled from "@emotion/styled";
import { css } from "@emotion/core";

// Basic styling objects used multiple times for styling the forms.
// Stored here to prevent code bloat in the general files.

export const styleObject = {
    TemplatesContainer: styled.div`
    `,
    FrameContainer: styled.div`
        display: flex;
    `,
    DocumentsContainer: styled.div`
        width: 300px;
        min-width: 300px;
        max-width: 300px;
        padding: 0.5rem;

        .document {
            cursor: pointer;
            padding: 0.5rem;
            background-color: #ebf8ff;
            border-top: 4px solid #4299e2;
            margin-bottom: 0.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .document.active {
            border-top-color: #38b2ac;
            background-color: #e6fffa;
        }
    `
};

export const cssObject = {
  firstStyle: css`
              text-align: center;
              font-weight: bold;
            `,
  secondStyle: css`
              text-align: center;
              flex-grow: 1;
              align-self: center;
              cursor: pointer;
            `,
  thirdStyle: css`
                display: flex;
                border-bottom: 1px solid #e2e8f0;
                list-style: none;
                margin: 0;
                padding: 0;
                li {
                  margin-right: 0.25rem;
                }
                li.selected {
                  margin-bottom: -1px;
                }
                a {
                  text-decoration: none;
                  padding-left: 1rem;
                  padding-right: 1rem;
                  padding-top: 0.5rem;
                  padding-bottom: 0.5rem;
                  font-weight: 600;
                  display: inline-block;
                  background-color: white;
                  border-style: solid;
                  border-color: #e2e8f0;
                }
                li.selected a {
                  color: #222;
                  border-bottom: none;
                  border-left-width: 1px;
                  border-right-width: 1px;
                  border-top-width: 1px;
                  border-top-left-radius: 0.25rem;
                  border-top-right-radius: 0.25rem;
                }

                li a {
                  color: #4299e1;
                  border-width: 0px;
                }
              `,
  fourthStyle: css`
              border: 1px solid #e2e8f0;
              border-top: none;
              padding: 2rem;
              display: flex;
              align-items: center;
              justify-content: center;
            `
};