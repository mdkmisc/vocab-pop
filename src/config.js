//var dotenv = require('dotenv'); // create-react-app loads from .env
//console.log(dotenv);
var config = {
  "cdmSchema": process.env.REACT_APP_CDM_SCHEMA,
  "resultsSchema": process.env.REACT_APP_RESULTS_SCHEMA,
  "apiRoot": process.env.REACT_APP_API_ROOT,
  "apiModel": process.env.REACT_APP_API_MODEL,
  "rootPath": process.env.REACT_APP_ROOTPATH,

};
//console.log(config);
export default config;

export var notBeingUsedRightNow = {
  // none of the rest being used, but may bring it back
  defaultFilters: {
    "excludeInvalidConcepts": true,
    "excludeNoMatchingConcepts": true,
    "excludeNonStandardConcepts": false
  },
  "filterFormSchema": {
    "type": "object",
    "properties": {
      "excludeInvalidConcepts": {
        "title": "Exclude Invalid Concepts",
        "type": "boolean"
      },
      "excludeNoMatchingConcepts": {
        "title": "Exclude No Matching Concepts",
        "type": "boolean"
      },
      "excludeNonStandardConcepts": {
        "title": "Exclude Non-Standard Concepts",
        "type": "boolean"
      }
    }
  },
  "menu items": [
    {
      "Home": [
        "Explore concepts/vocabularies independently",
        "Explore concepts referenced in your CDM"
      ]
    },
    {
      "Drug": [
        {
          "type": "group, filter, ignore"
        },
        {
          "class": "group, filter, ignore"
        },
        {
          "column": "drug_concept_id, drug_source_concept_id"
        }
      ]
    },
    "Condition",
    "Search"
  ],
  "left navbar": [
    "Settings",
    "Filters",
    "History",
    "Data loaded"
  ],
  "paths": {
    "drug_exposure": {
      "target": {
        "class": "blah foo"
      }
    }
  },
  "conceptAttributes": [
    "table_name",
    "column_name",
    "standard_concept",
    "domain_id",
    "vocabulary_id",
    "concept_class_id"
  ],
  "tables": {
    "drug_exposure": {
      "rank": 1,
      "tableName": "drug_exposure",
      "niceName": "Drug Exposure",
      "enabled": true,
      "target_col": "drug_concept_id",
      "source_col": "drug_source_concept_id",
      "type_col": "drug_type_concept_id",
      "fk": {
        "person": "person_id, person_id",
        "provider": "provider_id, provider_id"
      }
    },
    "condition_occurrence": {
      "rank": 2,
      "tableName": "condition_occurrence",
      "niceName": "Condition Occurrence",
      "enabled": true,
      "source": "condition_source_concept_id",
      "target": "condition_concept_id",
      "type": "condition_type_concept_id"
    },
    "death": {
      "hidden": true,
      "rank": 30
    },
    "measurement": {
      "hidden": true,
      "rank": 30
    },
    "observation": {
      "hidden": true,
      "rank": 30
    },
    "procedure_occurrence": {
      "hidden": true,
      "rank": 30
    },
    "visit_occurrence": {
      "hidden": true,
      "rank": 30
    }
  },
  "attributes of use": [
    "exclude concept_id=0, No matching concept",
    "include only primary target columns (e.g., drug_concept_id)",
    "include only primary source columns (e.g., drug_source_concept_id)"
  ],
  "mightInclude": [
    "care_site",
    "fact_relationship -- is this table correct?",
    "location?",
    "observation_period?",
    "payer_plan_period?",
    "person (demographics?)",
    "cost tables?",
    "provider (specialty)?",
    "visit"
  ]
}
