import React, {useState} from "react";
import { useTranslation } from "react-i18next";
import "./LanguageButtons.css"; // Import the CSS file for styling

const LanguageButtons = () => {
    const { i18n } = useTranslation();
    const [activeLang, setActiveLang] = useState(i18n.language);
  
    const changeLanguage = (language) => {
      i18n.changeLanguage(language);
      setActiveLang(language); // Update active language state
    };
    // Return the language buttons with the active language highlighted
    return (
      <div className="language-buttons">
        <button
          className={activeLang === "en" ? "active" : ""}
          onClick={() => changeLanguage("en")}
        >
          English
        </button>
        <button
          className={activeLang === "de" ? "active" : ""}
          onClick={() => changeLanguage("de")}
        >
          Deutsch
        </button>
      </div>
    );
  };
  
  export default LanguageButtons;
