import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSnapshot } from 'valtio';

import config from '../config/config';
import state from '../store';
import { download } from '../assets';
import { downloadCanvasToImage, reader } from '../config/helpers';
import { EditorTabs, FilterTabs, DecalTypes } from '../config/constants';
import { fadeAnimation, slideAnimation } from '../config/motion';
import { AIPicker, ColorPicker, CustomButton, FilePicker, Tab } from '../components';

const Customizer = () => {
  const snap = useSnapshot(state);

  const [file, setFile] = useState(''); // for uploading files
  const [prompt, setPrompt] = useState(''); // for AI prompt
  const [generatingImg, setGeneratingImg] = useState(false); // loading state for the image generation

  // Active states for the Editor Tab and Filter Tab
  const [activeEditorTab, setActiveEditorTab] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState({
    logoShirt: true,
    stylishShirt: false,
  })

  // State to track whether the picker is open or closed
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Show or hide the picker based on the isPickerOpen state
  const togglePicker = () => {
    setIsPickerOpen(!isPickerOpen);
  };

  // show tab content depending on the activeTab
  const generateTabContent = () => {
    switch (activeEditorTab) {
      case "colorpicker":
        return <ColorPicker />
      case "filepicker":
        return <FilePicker
          file={file}
          setFile={setFile}
          readFile={readFile}
        />
      case "aipicker":
        return <AIPicker
          prompt={prompt}
          setPrompt={setPrompt}
          generatingImg={generatingImg}
          handleSubmit={handleSubmit}
        />
      default:
        return null;
    }
  }

  const handleSubmit = async (type) => {
    if (!prompt) return alert("Please enter a prompt");

    try {
      // call the backend to generate an AI image
      setGeneratingImg(true);

      const response = await fetch('https://fabrikthreejs.onrender.com/api/v1/dalle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
        })
      })

      if (response.ok) {
        const data = await response.json();
        // to update the logo on the shirt based on the prompt result
        handleDecals(type, `data:image/png;base64,${data.photo}`);
      } else {
        alert("Error: Failed to generate AI image.");
      }

    } catch (error) {
      alert(error)
    } finally {
      setGeneratingImg(false);
      setActiveEditorTab("");
    }
  }

  const handleDecals = (type, result) => {
    const decalType = DecalTypes[type];

    state[decalType.stateProperty] = result; // update the values of the state

    if (!activeFilterTab[decalType.filterTab]) {
      handleActiveFilterTab(decalType.filterTab)
    }
  }

  // check if the logo/texture is showing or not
  const handleActiveFilterTab = (tabName) => {
    switch (tabName) {
      case "logoShirt":
        state.isLogoTexture = !activeFilterTab[tabName]; // to toggle it on or off
        break;
      case "stylishShirt":
        state.isFullTexture = !activeFilterTab[tabName];
        break;
      default:
        state.isLogoTexture = true;
        state.isFullTexture = false;
        break;
    }

    // after setting the state, activeFilterTab is updated
    setActiveFilterTab((prevState) => {
      return {
        ...prevState,
        [tabName]: !prevState[tabName]
      }
    })
  }

  // take in the type of the file and passed to reader function to get the file data
  const readFile = (type) => {
    reader(file)
      .then((result) => {
        handleDecals(type, result); // passed in the decal of the shirt depending on the type of image
        setActiveEditorTab("");
      })
  }

  return (
    <AnimatePresence>
      {/* If not the homepage, then display the following */}
      {!snap.intro && (
        <>
          {/* Display the tab on the left side of the canvas */}

          <motion.div
            key="custom"
            className="absolute top-0 left-0 z-10"
            {...slideAnimation('left')}
          >
            <div className="flex items-center min-h-screen">
              <div className="editortabs-container tabs">
                {EditorTabs.map((tab) => (
                  <Tab
                    key={tab.name}
                    tab={tab}
                    handleClick={() => {
                      setActiveEditorTab(tab.name);
                      togglePicker();
                    }}

                  />
                ))}

                {isPickerOpen && generateTabContent()}
              </div>
            </div>
          </motion.div>

          {/* Display the back and download button */}
          <motion.div
            className="absolute z-10 top-5 right-5"
            {...fadeAnimation}
          >
            <CustomButton
              type="filled"
              title="Go Back"
              handleClick={() => state.intro = true}
              customStyles="w-fit px-4 py-2.5 font-bold text-sm"
            />
          </motion.div>

          {/* Display the three buttons (turn off/on the: 1. logo or 2. decal, and 3. download the shirt) on the bottom part */}
          <motion.div
            className='filtertabs-container'
            {...slideAnimation("up")}
          >
            {FilterTabs.map((tab) => (
              <Tab
                key={tab.name}
                tab={tab}
                isFilterTab
                isActiveTab={activeFilterTab[tab.name]}
                handleClick={() => handleActiveFilterTab(tab.name)}
              />
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default Customizer