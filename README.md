# ADA 2026 Simplified Type 2 Diabetes Drug Recommender

A web-based clinical decision support tool that provides simplified drug recommendations for Type 2 Diabetes management based on current ADA 2026 guidelines. The application guides healthcare providers through a structured decision tree to identify appropriate treatment options tailored to individual patient profiles.

## Features

- **Interactive Decision Tree**: Step-by-step guided questionnaire that narrows down drug recommendations
- **Visual Flowchart**: Real-time flowchart visualization showing the user's decision path
- **Drug Comparison**: Side-by-side comparison of recommended medications with detailed information
- **Patient-Specific Recommendations**: Considers multiple clinical factors including:
  - Glycemic control (A1C levels)
  - Cardiovascular and renal status
  - Weight management needs
  - Hypoglycemia risk tolerance
  - Cost considerations
  - Specific comorbidities and contraindications
- **Demo Case Loading**: Pre-loaded example cases for demonstration purposes
- **Persistent State**: Saves user progress using local browser storage

## Project Structure

```
├── drug_recommendation_app.html    # Main application interface
├── drug_recommendation_app.css     # Styling and layout
├── drug_recommendation_app.js      # Application logic and decision engine
├── Drugs.json                      # Drug database with properties and cautions
└── README.md                       # This file
```

## File Descriptions

### drug_recommendation_app.html
Main HTML structure with:
- Hero section with application title and description
- Two-tab interface:
  - **Tab 1**: Flowchart view and guided decision tree questionnaire
  - **Tab 2**: Drug recommendations and comparison board
- Accessible UI with ARIA labels and semantic HTML

### drug_recommendation_app.js
Core application logic including:
- Decision tree engine for clinical pathway navigation
- Drug recommendation algorithm
- Data loading and validation
- UI state management
- Flowchart visualization
- Progress tracking and history

### drug_recommendation_app.css
Responsive styling with:
- Panel-based layout system
- Tab navigation styling
- Form input components
- Flowchart visualization styles
- Mobile-friendly responsive design

### Drugs.json
Comprehensive drug database containing:
- Individual drug profiles (metformin, SGLT2 inhibitors, GLP-1 RAs, DPP-4 inhibitors, etc.)
- Drug class metadata and descriptions
- Clinical properties (cost, weight effects, hypoglycemia risk)
- Major cautions and exclusion conditions
- Dosing information

## Supported Drug Classes

1. **Metformin** - Foundational low-cost oral option
2. **SGLT2 inhibitors** - Oral class with cardiorenal benefits (e.g., empagliflozin)
3. **GLP-1 RA** - Injectable class for ASCVD and weight support
4. **Dual GIP/GLP-1 RA** - High-potency injectable option
5. **DPP-4 inhibitors** - Oral, weight-neutral fallback
6. **Pioglitazone** - Lower-cost oral alternative
7. **Basal insulin** - For severe hyperglycemia

## How to Use

1. **Open the Application**: Load `drug_recommendation_app.html` in a web browser
2. **Complete the Intake Form**: Answer clinical questions in the "Guided Decision Tree" panel on the left
3. **Review the Flowchart**: Watch the visual pathway update in the "Flowchart View" panel on the right
4. **View Recommendations**: Switch to the "Recommendations and Comparison" tab to see recommended drugs
5. **Compare Options**: Review drug properties, cautions, and clinical notes for each recommendation
6. **Reset**: Use the "Reset to defaults" button to start a new patient case

## Demo Case

Click the "Load demo case" button to populate the form with pre-configured example patient values for testing and demonstration.

## Technical Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Local storage enabled (for state persistence)
- No external dependencies required (vanilla JavaScript)

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Responsive design included

## Data Persistence

Patient intake data is automatically saved to the browser's local storage under the key `ada-2026-simplified-therapy-app-v1`. This allows users to:
- Resume previous sessions
- Maintain decision history
- Track progress across visits

## Clinical Notes

This tool is designed to assist clinical decision-making based on simplified 2026 ADA guidelines. It is an educational and decision-support tool and should not replace clinical judgment or comprehensive patient assessment. All recommendations should be reviewed and adapted to individual patient circumstances by qualified healthcare providers.

## Version

Application Version: 1.0 (ADA 2026 Simplified Translation)

## License

[Add appropriate license information here]

## Support

For questions or issues regarding the application, please contact the development team.
