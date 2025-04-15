import {MeTourConfig} from '@mobileye/material/src/lib/common';

export const MEST_FORM_TOUR_ID = 'mest_form_tour';
export const CLIP_LIST_FORM_TOUR_ID = 'clip_list_form_tour';
export const PARSING_CONFIGURATION_FORM_TOUR_ID = 'parsing_configuration_form_tour';
export const PARSING_CONFIGURATION_CUSTOM_STEP_ID = 'customExpandStep';
export const mestFormTour: MeTourConfig = {
  id: MEST_FORM_TOUR_ID,
  menuTitle: 'MEST Tour',
  route: ['manage', 'mests', 'create'],
  creationDate: '2024-03-21',
  steps: [
    {
      headlineTitle: 'Welcome to MEST CMD Template Tour',
      isStartStep: true,
      stepMaxWidth: 'medium',
      innerHtml: `
        <div>
          As part of the ETL, DEEP is triggering cloud-mest on the users behalf.<br/>
          The MEST cmd templates are used when launching ETLs that ingest MEST outputs (itrks/PEXTs).
        </div>
      `,
    },
    {
      title: 'The MEST CMD Template',
      stepMaxWidth: 'medium',
      showPrevButton: true,
      innerHtml: `
        <div>
          The template breaks down the MEST CMD to subcomponents making it clear to view and maintain.<br/>
          The templates can be shared as they reside in a catalog accessible by all DEEP users.
        </div>
      `,
    },
    {
      title: 'Example CMD',
      stepMaxWidth: 'large',
      showPrevButton: true,
      innerHtml: `Let's break down the following MEST CMD and fill template form accordingly.<br /><br />
      <code class="me-tour-code-block">
/usr/bin/cloud-mest
<b>-c</b> /mobileye/algo_OBJD/itaibi/MEST/lists/momo_test.list
<b>-m</b> /homes/itaibi/repos/mest/all_branches/av/bundle/ME.Develop/applications/GV/CV_GV_EyeQ5sw_tbb.s5
/homes/itaibi/repos/mest/all_branches/av/bundle/ME.Develop/applications/GV/libSRD_EyeQ5sw_tbb.so,
/homes/itaibi/repos/mest/all_branches/av/bundle/ME.Develop/applications/GV/brainLibs_EyeQ5sw_tbb/
<b>-o</b> /mobileye/algo_OBJD/itaibi/MEST/Truck_and_Trailer/V5/251021/dev -n momo_test_list_plus_truck_and_trailer_dev
<b>-p</b> "itrk-cfg=/mobileye/algo_OBJD/shared/itrk-cfg/vd3d_full.icfg : mode=0 : vd3dPCMode=false vd3dUseCheapIFMode=false runWheel=true vd3dFixOrientationWithWheels=true vd3dRunAndReportBikes=true vd3dDebugClustering=true vd3dLoadBalance=0 vd3dDisapproveVehicleReflectionOnHost=2 vd3dUseFullImageClassification=true : -sno_i386 : ETHERNET1: enabled=false : CAN1: protocols= CAN2: protocols= UART1: protocols= UART2: protocols= SPI: protocols= : -sdumpLut=local -sdumpMeta=local -sdumpCoord=local : disableTSR=true noSLI=true : "
--output-f2p
--ignore-missing
--timeout 60
--container-memory 7500
--etc-base-uri s3://mobileye-team-vd/etc_repository
      </code>
`,
    },
    {
      title: 'MEST Binary Files',
      targetSelector: '.paths-container',
      stepMaxWidth: 'large',
      showPrevButton: true,
      tooltipOptions: {
        placement: 'right-start',
      },
      innerHtml: `
      <div class="m-0 p-0">
        <div>
        See below the part of the MEST CMD pointing to the binary files:
        <code class="me-tour-code-block">
<b>-m</b>
/homes/itaibi/repos/mest/all_branches/av/bundle/ME.Develop/applications/GV/CV_GV_EyeQ5sw_tbb.s5
/homes/itaibi/repos/mest/all_branches/av/bundle/ME.Develop/applications/GV/libSRD_EyeQ5sw_tbb.so,
/homes/itaibi/repos/mest/all_branches/av/bundle/ME.Develop/applications/GV/brainLibs_EyeQ5sw_tbb/
        </code>
        <div class="my-2">When executing your ETL you will be required to provide the path to the binary files stored in the template.</div>
        <div style="overflow: hidden;">
          <img style="width: 100%;object-fit: contain" src="./../../assets/images/tours/root_path_example.webp"/>
        </div>
        The MEST "Executable", "Libs" and "Brain Libs" fields can be a file name or a relative path to the folder you provide.<br/><br/>
        The template allows you to provide multiple options for each of the fields, DEEP will look for files by the order you mention and will choose the first successful match.<br/><br/>
        For example, if the specified options are "CV_GV_EyeQ5sw_tbb.s5" and "GV_Wono", DEEP will first look for "CV_GV_EyeQ5sw_tbb.s5" and, if it is not found, will search for "GV_Wono".
        </div>
      </div>
      `,
      actions: [
        {
          inputSelector: '.executable-control li:nth-of-type(1) input',
          text: 'CV_GV_EyeQ5sw_tbb.s5',
          type: 'paste',
        },
        {
          inputSelector: '.executable-control li:nth-of-type(2) input',
          text: 'GV_Wono',
          type: 'paste',
        },
        {
          inputSelector: '.libs-control li:nth-of-type(1) input',
          text: 'libSRD_EyeQ5sw_tbb.so',
          type: 'paste',
        },
        {
          inputSelector: '.libs-control li:nth-of-type(2) input',
          text: 'eyeq4/release-st/Wono/libWono.so',
          type: 'paste',
        },
        {
          inputSelector: '.brain-libs-control li:nth-of-type(1) input',
          text: 'brainLibs_EyeQ5sw_tbb',
          type: 'paste',
        },
        {
          inputSelector: '.brain-libs-control li:nth-of-type(2) input',
          text: 'eyeq4/release-st/Wono/brain',
          type: 'paste',
        },
      ],
    },
    {
      title: 'See below the parameters part of the MEST CMD:',
      targetSelector: '.params-control',
      stepMaxWidth: 'large',
      showPrevButton: true,
      tooltipOptions: {
        placement: 'left',
      },
      innerHtml: `
      <p>
      <code class="me-tour-code-block my-2">
<b>-p</b>
itrk-cfg=/mobileye/algo_OBJD/shared/itrk-cfg/vd3d_full.icfg : mode=0 : vd3dPCMode=false vd3dUseCheapIFMode=false runWheel=true vd3dFixOrientationWithWheels=true vd3dRunAndReportBikes=true vd3dDebugClustering=true vd3dLoadBalance=0 vd3dDisapproveVehicleReflectionOnHost=2 vd3dUseFullImageClassification=true : -sno_i386 : ETHERNET1: enabled=false : CAN1: protocols= CAN2: protocols= UART1: protocols= UART2: protocols= SPI: protocols= : -sdumpLut=local -sdumpMeta=local -sdumpCoord=local : disableTSR=true noSLI=true :
      </code>
      To spare manual filling of parameters fields you can: <br/>
      <div class="pl-4 border-box">
        1. Copy the parameters segment of the MEST CMD to the designated area.<br/>
        2. Press anywhere outside the text area.<br/>
        3. DEEP will <b>suggest</b> a break down of the parameters - please verify correctness.
      </p>
      </div>
      `,
      actions: [
        {
          inputSelector: '.params-control textarea',
          text: 'itrk-cfg=/mobileye/algo_OBJD/shared/itrk-cfg/vd3d_full.icfg : mode=0 : vd3dPCMode=false vd3dUseCheapIFMode=false runWheel=true vd3dFixOrientationWithWheels=true vd3dRunAndReportBikes=true vd3dDebugClustering=true vd3dLoadBalance=0 vd3dDisapproveVehicleReflectionOnHost=2 vd3dUseFullImageClassification=true : -sno_i386 : ETHERNET1: enabled=false : CAN1: protocols= CAN2: protocols= UART1: protocols= UART2: protocols= SPI: protocols= : -sdumpLut=local -sdumpMeta=local -sdumpCoord=local : disableTSR=true noSLI=true :\n',
          type: 'paste',
          waitFor: 400,
        },
      ],
    },
    {
      title: 'Cloud MEST Arguments',
      targetSelector: '.args-control',
      stepMaxWidth: 'large',
      showPrevButton: true,
      tooltipOptions: {
        placement: 'left',
      },
      innerHtml: `
      <p>
      See below the flags that are passed to cloud-mest:
      <code class="me-tour-code-block">
--output-f2p
--ignore-missing
--timeout 60
--container-memory 7500
--etc-base-uri s3://mobileye-team-vd/etc_repository
      </code>
      </p>
      `,
      actions: [
        {
          inputSelector: '.args-control textarea',
          text: '--output-f2p\n--ignore-missing\n--timeout 60\n--container-memory 7500\n--etc-base-uri s3://mobileye-team-vd/etc_repository',
          type: 'paste',
          waitFor: 400,
        },
      ],
    },
  ],
};
export const clipListFormTour: MeTourConfig = {
  id: CLIP_LIST_FORM_TOUR_ID,
  menuTitle: 'Clip List Tour',
  route: ['manage', 'clip-lists', 'create'],
  creationDate: '2024-03-21',
  steps: [
    {
      headlineTitle: 'Welcome to Clip List Creation Tour',
      isStartStep: true,
      stepMaxWidth: 'medium',
      innerHtml: `
        <div>
         The clip-lists are stored and managed in a catalog where you can view and use clip-lists also created by other teams.<br/>
         When running a job in DEEP the clip-list is used to define which inputs your ETL will receive. I.e., when executing a job that ingests MEST output the clip list will be passed to cloud-mest to determine which clip will be processed by MEST.
        </div>
      `,
    },
    {
      title: 'Upload file',
      stepMaxWidth: 'medium',
      showPrevButton: true,
      targetSelector: 'me-upload-file',
      innerHtml: `
        <div>
          Upload your clip-list file and click 'Create' button. <br/>
          DEEP will validate the file and provide feedback if any issues are detected.
        </div>
      `,
    },
    {
      title: 'Choose a Type',
      stepMaxWidth: 'medium',
      showPrevButton: true,
      targetSelector: '.type-control',
      tooltipOptions: {
        placement: 'right',
      },
      actions: [
        {
          controlSelector: '.type-control .mat-mdc-select',
          type: 'click-element',
        },
      ],
      innerHtml: `
        According to the content of the file uploaded:
        <ul>
          <li>Clip - List of clip names (specified in MDB/DE-Search).</li>
          <li>MDB Playlist - List of PLS (playlist) names. (specified in MDB/DE-Search).</li>
          <li>Custom Playlist- List of custom PLS (playlists) files stored in Mobileye's file system. Currently DEEP stores only the path to the PLSs and not their content. Thus, in case you change the PLS content in "/mobileye/",  it will be used when using the PLS in DEEP.</li>
          <li>Generic - Generic input, a list of strings. Used in Metro flow for TFRecords.</li>
        </ul>
      `,
    },
    {
      title: 'Choose a Technology',
      stepMaxWidth: 'medium',
      showPrevButton: true,
      targetSelector: '.technology-control',
      tooltipOptions: {
        placement: 'right',
      },
      actions: [
        {
          controlSelector: '.technology-control .mat-mdc-select',
          type: 'click-element',
        },
      ],
      innerHtml: `
        <div>
          Choose the technology that your clip list file relates to.<br/>
          It will make it easier to look for this clip list or others in the catalog that are related to this technology.<br/>
          <b>If Technology is missing, please create a DEEP JIRA ticket.</b>
        <div>
      `,
    },
    {
      title: 'Filters',
      stepMaxWidth: 'medium',
      showPrevButton: true,
      targetSelector: '.optional-controls',
      tooltipOptions: {
        placement: 'right',
      },
      actions: [
        {
          inputSelector: '.brain-control input',
          type: 'paste',
          text: 'mono8',
          waitFor: 250,
        },
        {
          inputSelector: '.camera-control input',
          type: 'paste',
          text: 'main',
          waitFor: 250,
        },
        {
          inputSelector: '.tags-control input',
          type: 'paste',
          text: 'VD-wono_bundle_vd_pd_2k',
          waitFor: 250,
        },
        {
          inputSelector: '.description-control textarea',
          type: 'paste',
          text: 'Function sanity',
          waitFor: 250,
        },
      ],
      innerHtml: `
        <div>
         Adding Brain, Camera, Tags and Description are optional <br/> but highly recommended for better filtering and identification.
        </div>
      `,
    },
  ],
};
export const parsingConfigurationFormTour: MeTourConfig = {
  id: PARSING_CONFIGURATION_FORM_TOUR_ID,
  menuTitle: 'Parsing Configuration Tour',
  route: ['manage', 'parsing-configurations', 'create'],
  creationDate: '2024-03-21',
  steps: [
    {
      headlineTitle: 'Welcome to Parsing Configuration Creation Tour',
      isStartStep: true,
      stepMaxWidth: 'medium',
      innerHtml: `
        <div>
        When running a job in DEEP the Parsing Configuration is used to define which exact data is going to be extracted from the MEST outputs (itrk & PEXT) and be utilized in the ETL.<br/>
        The Parsing Configurations are stored and managed in a catalog where you can view and use configurations created also by other teams.
        </div>
      `,
    },
    {
      title: 'Select a folder',
      stepMaxWidth: 'medium',
      showPrevButton: true,
      targetSelector: '.folder-control',
      tooltipOptions: {
        placement: 'right',
      },
      actions: [
        {
          controlSelector: '.folder-control .autocomplete-trigger',
          type: 'click-element',
        },
      ],
      innerHtml: `
      <div>
        Select an existing folder or create a new one by inserting a new folder name and clicking the first dropdown option.<br />
        The folder name should indicate the technology the configuration is related to.
      </div>
      `,
    },
    {
      title: 'Data components extraction from itrk/PEXT',
      showPrevButton: true,
      id: PARSING_CONFIGURATION_CUSTOM_STEP_ID,
      template: null, //defined in parsing configuration form
    },
    {
      title: 'Tools to fix your json',
      showPrevButton: true,
      targetSelector: '.jse-menu',
      stepMaxWidth: 'large',
      tooltipOptions: {
        placement: 'left',
      },
      innerHtml: `
      <div>
        Use these menu buttons for:
        <ul>
          <li>Format JSON data, with proper indentation and line feeds.</li>
          <li>Compact JSON data, remove all whitespaces.</li>
          <li>Sort content.</li>
          <li>Use the search and replace feature to find and replace specific content within the JSON data.</li>
          <li>Click 'Back' to revert to the previous JSON change.</li>
          <li>Click 'Next' to proceed to the next JSON change.</li>
        </ul>
      </div>
      `,
    },
  ],
};
export const allTours: Array<MeTourConfig> = [
  mestFormTour,
  clipListFormTour,
  parsingConfigurationFormTour,
];
