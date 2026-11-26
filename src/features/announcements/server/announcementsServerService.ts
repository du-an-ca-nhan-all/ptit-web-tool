import { AnnouncementItem } from '../types/announcement.types';
import {
  getActiveAnnouncements as getActiveAnnouncementsHandler,
  getAllAnnouncementsAdmin as getAllAnnouncementsAdminHandler,
} from './announcements-server-service/announcementsQueryService';
import {
  bulkDeleteAnnouncements as bulkDeleteAnnouncementsHandler,
  createAnnouncement as createAnnouncementHandler,
  deleteAnnouncement as deleteAnnouncementHandler,
  incrementAnnouncementViews as incrementAnnouncementViewsHandler,
  toggleAnnouncementStatus as toggleAnnouncementStatusHandler,
  updateAnnouncement as updateAnnouncementHandler,
} from './announcements-server-service/announcementsMutationService';

export type { AnnouncementItem };

export const announcementsService = {
  getActiveAnnouncements: getActiveAnnouncementsHandler,
  getAllAnnouncementsAdmin: getAllAnnouncementsAdminHandler,
  createAnnouncement: createAnnouncementHandler,
  updateAnnouncement: updateAnnouncementHandler,
  toggleAnnouncementStatus: toggleAnnouncementStatusHandler,
  deleteAnnouncement: deleteAnnouncementHandler,
  bulkDeleteAnnouncements: bulkDeleteAnnouncementsHandler,
  incrementAnnouncementViews: incrementAnnouncementViewsHandler,
};

export const getActiveAnnouncements = announcementsService.getActiveAnnouncements;
export const getAllAnnouncementsAdmin = announcementsService.getAllAnnouncementsAdmin;
export const createAnnouncement = announcementsService.createAnnouncement;
export const updateAnnouncement = announcementsService.updateAnnouncement;
export const toggleAnnouncementStatus = announcementsService.toggleAnnouncementStatus;
export const deleteAnnouncement = announcementsService.deleteAnnouncement;
export const bulkDeleteAnnouncements = announcementsService.bulkDeleteAnnouncements;
export const incrementAnnouncementViews = announcementsService.incrementAnnouncementViews;
