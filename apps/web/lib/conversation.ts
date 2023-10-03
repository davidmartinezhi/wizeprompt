/**
 * This module contains functions to interact with the Conversation model in the database.
 * @packageDocumentation
 */

import type { Tag, Conversation, Prisma } from "@prisma/client";
import type { PrismaResponse } from "@/types/prisma-client-types";
import type { ModelParameters } from "@/types/model-parameters-types";
import prisma from "./prisma";
import { areValidModelParameters } from "./prisma-input-validation";

/**
 * Retrieves all conversations from the database that match the given user ID.
 * @param idUser - The ID of the user to filter conversations.
 * @returns An object containing either an array of conversations or an error object.
 */
export async function getAllConversationsByUserId(
  idUser: number
): Promise<PrismaResponse<Conversation[]>> {
  try {
    // Validate idUser
    if (!idUser || idUser < 0) {
      return { status: 400, message: 'Invalid user ID' };
    }

    // Check if the user exists in the database
    const userExists = await prisma.user.findUnique({
      where: { id: idUser },
    });

    if (!userExists) {
      return { status: 404, message: 'User not found' };
    }

    // Search all conversations in the database that match the user ID
    const conversations: Conversation[] = await prisma.conversation.findMany({
      where: {
        idUser, // User id to filter conversations
        active: true, // Only fetch active conversations
      },
      include: {
        messages: false, // Do not include messages from each conversation
        tags: true, // Include tags from each conversation
        model: {
          select: {
            name: true, // Only select the name of the model
            provider: {
              select: {
                image: true, // Only select the logo (image) of the provider
              },
            },
          },
        }, // Include only specific fields from model and provider
      },
    });

    // If there are no conversations, return a message indicating that there are none
    if (conversations.length === 0) {
      return { status: 404, message: 'No conversations found for this user' };
    }

    // Return found conversations
    return { data: conversations, status: 200 };
  } catch (error: any) {
    // Handle any errors that occur during the fetch
    return { status: 500, message: error.message };
  }
}

/**
 * Retrieves a conversation from the database by its ID, along with all its details.
 * @param id - The ID of the conversation to retrieve.
 * @returns An object containing the retrieved conversation, or an error message if the conversation is not found.
 */
export async function getConversationById(
  id: number
): Promise<PrismaResponse<Conversation>> {
  try {
    // Validate id
    if (!id || id <= 0) {
      return { status: 400, message: 'Invalid conversation ID' };
    }

    // Fetch the conversation from the database that matches the given ID
    const conversation: Conversation | null = await prisma.conversation.findUnique({
      where: {
        id, // Conversation ID to filter
      },
      // Include additional models (relations) in the result
      include: {
        user: true, // Include user details
        model: true, // Include model details
        messages: true, // Include messages in the conversation
        tags: true, // Include tags associated with the conversation
      },
    });

    // If the conversation is not found, return a message indicating so
    if (!conversation) {
      return { status: 404, message: 'Conversation not found' };
    }

    // Return the found conversation along with all its details
    return { data: conversation, status: 200 };
  } catch (error: any) {
    // Handle any errors that occur during the fetch
    return { status: 500, message: error.message };
  }
}

/**
 * Represents the creation information for a conversation.
 */
interface ConversationDataInput {
  idUser: number;
  idModel: number;
  title: string;
  tags: { id: number }[]; // Assuming tags are identified by their ID
  parameters: JSON; // Optional, if you have specific parameters for the conversation
  active: boolean; // Optional, defaults to true based on your schema
  useGlobalParameters: boolean; // New parameter to decide whether to use global parameters
}

/**
 * Creates a new conversation in the database.
 * @param input - The conversation data input.
 * @returns A promise that resolves to a PrismaResponse containing the newly created conversation or an error message.
 */
export async function createConversation(
  input: ConversationDataInput
): Promise<PrismaResponse<Conversation>> {
  try {

    const { idUser, idModel, title } = input || {};

    // Validate input
    if (!idUser || !idModel || !title) {
      return { status: 400, message: 'Invalid input for creating conversation' };
    }

    // Validate that the user exists and fetch globalParameters if needed
    const user = await prisma.user.findUnique({
      where: {
        id: idUser,
      },
      select: {
        globalParameters: true, // Select globalParameters
      },
    });

    if (!user) {
      return { status: 404, message: 'User not found' };
    }

    // Validate that the model exists
    const model = await prisma.model.findUnique({
      where: {
        id: idModel,
      },
    });

    if (!model) {
      return { status: 404, message: 'Model not found' };
    }

    // Prepare parameters based on useGlobalParameters flag
    const userGlobalParameters: Record<string, unknown> = user.globalParameters ? JSON.parse(String(user.globalParameters)) : {};
    const modelParameters: Record<string, unknown> | undefined = userGlobalParameters[model.name] as Record<string, unknown> | undefined;
    const parameters: Record<string, unknown> | undefined | null = input.useGlobalParameters ? modelParameters : undefined;

    // Create a new conversation in the database
    const newConversation = await prisma.conversation.create({
      data: {
        ...input,
        parameters: parameters ? JSON.stringify(parameters) : JSON.stringify({}), // Set parameters if applicable
        tags: input.tags ? { connect: input.tags } : undefined, // Connect tags if provided
        active: true, // Set the 'active' field to true by default
      },
      // Include additional models (relations) in the result
      include: {
        user: true, // Include user details
        model: true, // Include model details
        messages: true, // Include messages in the conversation
        tags: true, // Include tags associated with the conversation
      },
    });

    // Return the newly created conversation
    return { data: newConversation, status: 201 };
  } catch (error: any) {
    // Handle any errors that occur during the creation
    return { status: 500, message: error.message };
  }
}

/**
 * Represents the updated information for a conversation.
 */
interface UpdatedInfo {
  tags?: Tag[]; // Array of tags associated with the conversation.
  title?: string; //The updated title of the conversation.
}

/**
 * Updates a conversation in the database by its ID.
 * @param id - The ID of the conversation to update.
 * @param updatedInfo - The new information to update the conversation with.
 * @param includeRelatedEntities - Whether to include related entities in the returned conversation object.
 * @returns An object containing either the updated conversation or an error object.
 */
export async function updateConversationById(
  id: number,
  updatedInfo: UpdatedInfo,
  includeRelatedEntities: boolean
): Promise<PrismaResponse<Conversation>> {
  try {
    // Validate id
    if (!id || id <= 0) {
      return { status: 400, message: 'Invalid conversation ID' };
    }

    // Validate title if provided
    if (updatedInfo.title && updatedInfo.title.trim() === '') {
      return { status: 400, message: 'Title cannot be empty' };
    }

    // Attempt to update the conversation in the database
    const conversation: Conversation | null = await prisma.conversation.update({
      where: { id },
      data: {
        tags: updatedInfo.tags ? { set: updatedInfo.tags } : undefined,
        title: updatedInfo.title || undefined,
      },
      include: includeRelatedEntities
        ? {
          user: true,
          model: true,
          messages: true,
          tags: true,
        }
        : {
          tags: true,
        },
    });

    // Check if the conversation was found and updated
    if (!conversation) {
      return { status: 404, message: 'Conversation not found' };
    }

    // Return the updated conversation
    return { data: conversation, status: 200 };
  } catch (error: any) {
    // Handle and return any errors that occur
    return { status: 500, message: error.message };
  }
}

/**
 * Updates the model parameters associated to the given conversation and used in the generation of promts. 
 * @param id - The ID of the conversation whose parameters will be updated.
 * @param parameters - An object of type ModelParameters that holds the parameter values with which to update the conversation. 
 * @returns Promise that resolves to an object that implements PrismaResponse<Conversation>, and that potentially contains the updated Conversation. 
 */
export async function updateConversationParameters(id: number, parameters: ModelParameters): Promise<PrismaResponse<Conversation>> {
  if (!areValidModelParameters(parameters)){
    return {status: 400, message: "Invalid model parameters"}; 
  }

  try {
    const conversation: Conversation = await prisma.conversation.update({
      where: { id }, 
      data: {
        parameters: parameters as any 
      }
    })

    return {status: 200, data: conversation}; 

  } catch (error: any) {
    return {status: 500, message: error.message}; 
  }
}

/**
 * Deletes a conversation from the database by setting its 'active' field to false.
 * @param id - The ID of the conversation to delete.
 * @returns An object with a message indicating whether the conversation was successfully marked as inactive or not, or an error if one occurred.
 */
export async function deactivateConversationById(
  id: number
): Promise<PrismaResponse<null>> {
  try {
    // Validate id
    if (!id || id <= 0) {
      return { status: 400, message: 'Invalid conversation ID' };
    }

    // Update the 'active' field of the conversation in the database that matches the given ID
    const conversation: Conversation | null = await prisma.conversation.update({
      where: {
        id, // Conversation ID to filter
      },
      data: {
        active: false, // Set the 'active' field to false
      },
    });

    // If the conversation is not found, return a message indicating so
    if (!conversation) {
      return { status: 404, message: 'Conversation not found' };
    }

    // Return a message indicating the conversation is now inactive
    return { status: 200, message: 'Conversation marked as inactive' };
  } catch (error: any) {
    // Handle any errors that occur during the update
    return { status: 500, message: error.message };
  }
}

/**
 * Marks all conversations associated with a given user as inactive.
 * @param idUser - The ID of the user whose conversations will be marked as inactive.
 * @returns An object containing a message indicating the conversations are now inactive and the number of conversations that were updated, or an error object if an error occurred during the update.
 */
export async function deactivateAllConversationsByUserId(
  idUser: number
): Promise<PrismaResponse<{ count: number }>> {
  try {
    // Check if the user exists
    const userExists = await prisma.user.findUnique({
      where: { id: idUser },
    });
    if (!userExists) {
      return { status: 404, message: 'User ID does not exist' };
    }

    // Update the 'active' field of all conversations that match the given user ID
    const updateResponse: Prisma.BatchPayload =
      await prisma.conversation.updateMany({
        where: {
          idUser, // Filter conversations by user ID
        },
        data: {
          active: false, // Set the 'active' field to false to mark them as inactive
        },
      });

    // Check if any conversations were updated
    if (updateResponse.count === 0) {
      return { status: 404, message: 'No conversations found for this user' };
    }

    // Return a message indicating the conversations are now inactive
    return {
      status: 200,
      message: 'Conversations marked as inactive',
      data: { count: updateResponse.count },
    };
  } catch (error: any) {
    // Handle any errors that occur during the update
    return { status: 500, message: error.message };
  }
}


/**
 * Deletes a conversation and all its associated messages from the database.
 * @param id - The ID of the conversation to delete.
 * @returns A promise that resolves to a PrismaResponse object indicating the status and message of the operation.
 */
export async function deleteConversationById(
  id: number
): Promise<PrismaResponse<null>> {
  try {
    // Validate the ID to ensure it's a positive integer
    if (!id || id <= 0) {
      return { status: 400, message: 'Invalid conversation ID' };
    }

    // Delete all messages associated with the conversation
    await prisma.message.deleteMany({
      where: {
        idConversation: id, // Filter messages by conversation ID
      },
    });

    // Delete the conversation from the database that matches the given ID
    const conversation: Conversation | null = await prisma.conversation.delete({
      where: {
        id, // Conversation ID to filter
      },
    });

    // If the conversation is not found, return a message indicating so
    if (!conversation) {
      return { status: 404, message: 'Conversation not found' };
    }

    // Return a message indicating the conversation was successfully deleted
    return { status: 200, message: 'Conversation and associated messages successfully deleted' };
  } catch (error: any) {
    // Handle any errors that occur during the deletion
    return { status: 500, message: error.message };
  }
}