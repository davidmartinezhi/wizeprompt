/**
 * ModalParametersGPT Component
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Prop to control the open state of the modal
 * @param {function} props.onOpenChange - Handler for changes to the open state
 * @return {JSX.Element} ModalParametersGPT component
 */
// Importing necessary libraries and components
"use client";
import { useState, useEffect, useContext } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Textarea,
  Tooltip,
  Switch,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@nextui-org/react";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { Slider } from "@/components/ui/slider";
import { PrismaUserContext, type PrismaUserContextShape } from "@/context/prisma-user-context";

interface Parameters {
  userContext: string;
  responseContext: string;
  temperature: number;
}

// ModalParametersGPT Component
export default function ModalParametersGPT(props: any): JSX.Element {
  // Destructuring props to get isOpen and onOpenChange properties
  const {
    isOpen,
    onOpenChange,
    userContext,
    responseContext,
    temperature,
    saveParameters,
  }: {
    isOpen: boolean;
    onOpenChange: () => void;
    userContext: string;
    responseContext: string;
    temperature: number;
    saveParameters: (updatedParameters: Parameters) => void;
  } = props;

  const prismaUserContext = useContext<PrismaUserContextShape | null>(PrismaUserContext);
  const prismaUser = prismaUserContext?.prismaUser;

  const [isSelected, setIsSelected] = useState<boolean>(false);

  const [updatedUserContext, setUpdatedUserContext] =
  useState<string>(userContext);
const [updatedResponseContext, setUpdatedResponseContext] =
  useState<string>(responseContext);
  const [updatedTemperature, setUpdatedTemperature] =
    useState<number>(temperature);

  const [globalFormParams, setGlobalFormParams] = useState<Parameters>({
    userContext,
    responseContext,
    temperature, // Default temperature value
  });

  useEffect(() => {

    if(isSelected) {
      // Access global parameters from prismaUser

      const globalUserContext = prismaUser?.globalParameters?.userContext || "";

      const globalResponseContext = prismaUser?.globalParameters?.responseContext || "";

      const globalTemperature = prismaUser?.globalParameters?.temperature || temperature;



      // Concatenate the text area values with global parameters
      const concatenatedUserContext = `${globalUserContext} ${updatedUserContext}`;
      const concatenatedResponseContext = `${globalResponseContext} ${updatedResponseContext}`;
      const finalTemperature = globalTemperature; // Example logic for combining temperatures


      // Create updated parameters object
      const updatedGlobalParameters: Parameters = {
        userContext: concatenatedUserContext,
        responseContext: concatenatedResponseContext,
        temperature: finalTemperature,
      };

      setGlobalFormParams(updatedGlobalParameters);


    }else{

      const updatedGlobalParameters: Parameters = {
        userContext: updatedUserContext,
        responseContext: updatedResponseContext,
        temperature: updatedTemperature,
      };

      setGlobalFormParams(updatedGlobalParameters);

    }
  }, [isSelected, 
      prismaUser?.globalParameters?.responseContext, 
      prismaUser?.globalParameters?.temperature, 
      prismaUser?.globalParameters?.userContext,
      temperature,
      updatedResponseContext,
      updatedTemperature,
      updatedUserContext]);

  const handleSave = (): void => {
    
    saveParameters(globalFormParams);

  };

  // Returning the Modal component
  return (
    <Modal
      isOpen={isOpen} // Prop to control the open state of the modal
      onOpenChange={onOpenChange} // Handler for changes to the open state
      placement="center" // Placement of the modal (centered)
      radius="sm" // Border radius of the modal (small)
      size="lg" // Size of the modal (large)
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {/* Title of the modal */}
              Conversation Context
            </ModalHeader>
            <ModalBody>
              {/* Label and Textarea for entering personal parameters */}
              <label className="mb-0" htmlFor="customInstructions">
                <p className="text-xs text-slate-600 dark:text-slate-200 wizeline-brand:text-slate-200">
                  What would you like ChatGPT to know about you to provide
                  better responses?
                </p>
              </label>
              {/* Tooltip for additional information on personal parameters */}
              <Tooltip content={<PersonalParameterTooltip />} placement="right">
                <Textarea
                  className="max-w-[800px] w-full p-0 text-sm text-slate-800 dark:text-slate-200 wizeline-brand:text-slate-200"
                  labelPlacement="outside"
                  maxRows={8}
                  minRows={8}
                  onChange={(e) => {
                    setGlobalFormParams({ ...globalFormParams, userContext: e.target.value });
                    setUpdatedUserContext(e.target.value);
                  }}
                  placeholder=""
                  radius="sm"
                  value={globalFormParams.userContext}
                  variant="faded"
                />
              </Tooltip>

              {/* Label and Textarea for entering response parameters */}
              <label className="mb-0" htmlFor="customInstructions">
                <p className="text-xs text-slate-600 dark:text-slate-200 wizeline-brand:text-slate-200">
                  How would you like ChatGPT to respond?
                </p>
              </label>
              {/* Tooltip for additional information on response parameters */}
              <Tooltip content={<ResponseParameterTooltip />} placement="right">
                <Textarea
                  className="max-w-[800px] w-full p-0 text-sm text-slate-800 dark:text-slate-200 wizeline-brand:text-slate-200"
                  labelPlacement="outside"
                  maxRows={8}
                  minRows={8}
                  onChange={(e) => {
                    setGlobalFormParams({ ...globalFormParams, responseContext: e.target.value });
                    setUpdatedResponseContext(e.target.value);
                  }}
                  placeholder=""
                  radius="sm"
                  value={globalFormParams.responseContext}
                  variant="faded"
                />
              </Tooltip>

              {/* Label and Slider for temperature parameters */}

              {/* Label for temperature parameters for xs and sm screens */}
              <div className="md:hidden">
                <Popover className="ml-auto md:hidden" placement="top">
                  <PopoverTrigger>
                    <label
                      className="mb-2 ml-auto md:hidden"
                      htmlFor="customInstructions"
                    >
                      <p className="flex text-xs text-slate-600 dark:text-slate-200 wizeline-brand:text-slate-200">
                        How creative should ChatGPT be?{" "}
                        <span className="text-lg">
                          <AiOutlineInfoCircle className="p-0 pl-1" />
                        </span>
                      </p>
                    </label>
                  </PopoverTrigger>
                  <PopoverContent>
                    <TemperatureTooltip />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Label for temperature parameters for md and above screens*/}
              <div className="hidden md:inline">
                <Tooltip content={<TemperatureTooltip />} placement="right">
                  <label
                    className="mb-0 hidden md:inline "
                    htmlFor="customInstructions"
                  >
                    <p className="flex text-xs text-slate-600 dark:text-slate-200 wizeline-brand:text-slate-200">
                      How creative should ChatGPT be?{" "}
                      <span className="text-lg">
                        <AiOutlineInfoCircle className="p-0 pl-1" />
                      </span>
                    </p>
                  </label>
                </Tooltip>
              </div>

              {/* Slider for temperature parameters */}
              <Slider
                //defaultValue={[globalFormParams.temperature]}
                max={1}
                min={0}
                onValueChange={(value: number[]) => {
                  setGlobalFormParams({ ...globalFormParams, temperature: value[0] })
                  setUpdatedTemperature(value[0]);
                }}
                step={0.1}
                value={[globalFormParams.temperature]}
              />
            </ModalBody>
            <ModalFooter className="flex flex-col md:flex-row justify-between">
              <div className="flex items-center justify-between mb-4 md:mb-0">
                {/* Switch for global parameters usage */}
                <p className="text-xs text-slate-800 dark:text-slate-200 wizeline-brand:text-slate-200">
                  Use Global GPT Context
                </p>
                <Switch
                  className="md:pl-3"
                  color="danger"
                  isSelected={isSelected}
                  onValueChange={setIsSelected}
                />
              </div>
              <div className="flex flex-col-reverse md:flex-row">
                {/* Cancel and Save buttons */}
                <Button
                  className="mb-2 md:mb-0 md:mr-2"
                  color="default"
                  onPress={onClose}
                  variant="light"
                >
                  Cancel
                </Button>
                <Button color="danger" onClick={handleSave} onPress={onClose}>
                  Save
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

// Component to display a tooltip with personal parameter prompts
function PersonalParameterTooltip(): JSX.Element {
  return (
    <div className="p-2">
      <h2 className="text-sm mb-1">Thought starters</h2>
      <ul className="list-disc list-inside text-xs text-slate-800 dark:text-slate-200 wizeline-brand:text-slate-200">
        {/* List of response parameter prompts */}
        <li>Where are you based?</li>
        <li>What do you do for work?</li>
        <li>What are your hobbies and interests?</li>
        <li>What subjects can you talk about for hours?</li>
        <li>What are some goals you have?</li>
      </ul>
    </div>
  );
}

// Component to display a tooltip with response parameter prompts
function ResponseParameterTooltip(): JSX.Element {
  return (
    <div className="p-2">
      <h2 className="text-sm mb-1">Thought starters</h2>
      <ul className="list-disc list-inside text-xs text-slate-800 dark:text-slate-200 wizeline-brand:text-slate-200">
        {/* List of personal parameter prompts */}
        <li>How formal or casual should ChatGPT be?</li>
        <li>How long or short should responses generally be?</li>
        <li>How do you want to be addressed?</li>
        <li>Should ChatGPT have opinions on topics or remain neutral?</li>
      </ul>
    </div>
  );
}

// Component to display a tooltip with information about temperature and creativity levels
function TemperatureTooltip(): JSX.Element {
  return (
    <div className="p-2">
      <h2 className="text-sm mb-1">Temperature and Creativity</h2>
      <ul className="list-disc list-inside text-xs text-slate-800 dark:text-slate-200 wizeline-brand:text-slate-200">
        {/* List of personal parameter prompts */}
        <li>
          Lower temperature ( left ) makes ChatGPT more focused and
          deterministic
        </li>
        <li>Higher temperature ( right ) makes it more creative and random</li>
      </ul>
    </div>
  );
}
