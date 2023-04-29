import React, { useContext, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";

import MenuItem from "@material-ui/core/MenuItem";
import Menu from "@material-ui/core/Menu";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import ConfirmationModal from "../ConfirmationModal";
import TransferTicketModal from "../TransferTicketModal";
import DeletePeoplesModal from "../DeletePeoplesModal";
import AddPeoplesModal from "../AddPeoplesModal";
import SelectAdminModal from "../SelectAdminModal";
import { toast } from "react-toastify";
import toastError from "../../errors/toastError";
import { Can } from "../Can";
import { AuthContext } from "../../context/Auth/AuthContext";
import RemoveAdminModal from "../RemoveAdminModal";

const TicketOptionsMenu = ({ ticket, menuOpen, handleClose, anchorEl }) => {
	const history = useHistory();

	const [confirmationOpen, setConfirmationOpen] = useState(false);
	const [transferTicketModalOpen, setTransferTicketModalOpen] = useState(false);
	const [deletePeoplesModal, setDeletePeoplesModal] = useState(false);
	const [addPeoplesModal, setAddPeoplesModal] = useState(false);
	const [selectAdminModal, setSelectAdminModal] = useState(false);
	const [removeAdminModal, setRemoveAdminModal] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false);
	const isMounted = useRef(true);
	const { user } = useContext(AuthContext);
	const numberOfGroup = history.location.pathname.split('/')[2];
	// console.log(ticket);

	useEffect(() => {
		return async () => {
			isMounted.current = false;
		};
	}, []);

	useEffect(() => {
		async function init() {
			try {
				if (ticket.isGroup) {
					const { data: { user } } = await api.get('/group/info');
					const { data: { groupMetadata: { participants } } } = await api.get(`/group/${ticket.contact.number}@g.us`)
					console.log(user, participants)
					const find = participants.find(e => e.isSuperAdmin)
					if (Number(user) === Number(find.id.user)) setIsAdmin(true);
				}
			} catch (error) {
				toast.error('Você ainda nao está autenticado ou o grupo não existe mais!');
				history.push('/tickets');
			}
		}
		init();
	}, [ticket])

	const handleDeleteTicket = async () => {
		try {
			await api.delete(`/tickets/${ticket.id}`);
		} catch (err) {
			toastError(err);
		}
	};

	const handleOpenConfirmationModal = e => {
		setConfirmationOpen(true);
		handleClose();
	};

	const handleOpenTransferModal = e => {
		setTransferTicketModalOpen(true);
		handleClose();
	};

	const handleOpenDeletePeoplesModal = e => {
		setDeletePeoplesModal(true);
		handleClose();
	};

	const handleOpenAddPeoplesModal = e => {
		setAddPeoplesModal(true);
		handleClose();
	};

	const handleOpenSelectAdminModal = e => {
		setSelectAdminModal(true);
		handleClose();
	};

	const handleOpenRemoveAdminModal = e => {
		setRemoveAdminModal(true);
		handleClose();
	};

	const handleCloseTransferTicketModal = () => {
		if (isMounted.current) {
			setTransferTicketModalOpen(false);
		}
	};

	const handleOnlyAdm = async (onlyAdminMenssage = true) => {
		const { data: { contact: { number } }, data } = await api.get(`/tickets/${numberOfGroup}`)
		// console.log(data);
		await api.put('/group/onlyAdmin', {
			chatID: `${number}@g.us`,
			onlyAdminMenssage
		})
		if (onlyAdminMenssage) toast.success('Agora só quem fala são os admins!');
		else toast.success('Agora todos podem falar!');
		handleClose();
	}

	const handleCloseDeletePeoplesModal = () => {
		if (isMounted.current) {
			setDeletePeoplesModal(false);
		}
	};

	const handleCloseAddPeoplesModal = () => {
		if (isMounted.current) {
			setAddPeoplesModal(false);
		}
	};

	const handleSelectAdminModal = () => {
		if (isMounted.current) {
			setSelectAdminModal(false);
		}
	};

	const handleRemoveAdminModal = () => {
		if (isMounted.current) {
			setRemoveAdminModal(false);
		}
	};

	const alertWarning = () => {
		toast.warning(`Para uma maior facilidade, 
		vefique se todos os contatos do grupo estão salvos na lista de contatos!`);;
	}

	return (
		<>
			<Menu
				id="menu-appbar"
				anchorEl={anchorEl}
				getContentAnchorEl={null}
				anchorOrigin={{
					vertical: "bottom",
					horizontal: "right",
				}}
				keepMounted
				transformOrigin={{
					vertical: "top",
					horizontal: "right",
				}}
				open={menuOpen}
				onClose={handleClose}
			>
				<MenuItem onClick={handleOpenTransferModal}>
					{i18n.t("ticketOptionsMenu.transfer")}
				</MenuItem>
				<Can
					role={user.profile}
					perform="ticket-options:deleteTicket"
					yes={() => (
						<MenuItem onClick={handleOpenConfirmationModal}>
							{i18n.t("ticketOptionsMenu.delete")}
						</MenuItem>
					)}
				/>
				{isAdmin && (
					<MenuItem onClick={handleOpenAddPeoplesModal}>
						Adicionar pessoas
					</MenuItem>
				)}
				{isAdmin && (
					<MenuItem onClick={() => {
						handleOpenDeletePeoplesModal()
						alertWarning();
					}}>
						Remover pessoas
					</MenuItem>
				)}
				{isAdmin && (
					<MenuItem onClick={() => {
						handleOpenSelectAdminModal()
						alertWarning();
					}}>
						Tornar pessoas admins
					</MenuItem>
				)}
				{isAdmin && (
					<MenuItem onClick={() => {
						handleOpenRemoveAdminModal()
						alertWarning();
					}}>
						Remover pessoas admins
					</MenuItem>
				)}
				{isAdmin && (
					<MenuItem onClick={handleOnlyAdm}>
						Bloquear só para administradores falarem
					</MenuItem>
				)}
				{isAdmin && (
					<MenuItem onClick={() => handleOnlyAdm(false)}>
						Desbloquar para todos falarem
					</MenuItem>
				)}
			</Menu>
			<ConfirmationModal
				title={`${i18n.t("ticketOptionsMenu.confirmationModal.title")}${
					ticket.id
				} ${i18n.t("ticketOptionsMenu.confirmationModal.titleFrom")} ${
					ticket.contact.name
				}?`}
				open={confirmationOpen}
				onClose={setConfirmationOpen}
				onConfirm={handleDeleteTicket}
			>
				{i18n.t("ticketOptionsMenu.confirmationModal.message")}
			</ConfirmationModal>
			<TransferTicketModal
				modalOpen={transferTicketModalOpen}
				onClose={handleCloseTransferTicketModal}
				ticketid={ticket.id}
				ticketWhatsappId={ticket.whatsappId}
			/>
			<AddPeoplesModal
				modalOpen={addPeoplesModal}
				onClose={handleCloseAddPeoplesModal}
				ticketid={ticket.id}
				ticketWhatsappId={ticket.whatsappId}
			/>
			<DeletePeoplesModal
				modalOpen={deletePeoplesModal}
				onClose={handleCloseDeletePeoplesModal}
				ticketid={ticket.id}
				ticketWhatsappId={ticket.whatsappId}
			/>
			<SelectAdminModal
				modalOpen={selectAdminModal}
				onClose={handleSelectAdminModal}
				ticketid={ticket.id}
				ticketWhatsappId={ticket.whatsappId}
			/>
			<RemoveAdminModal
				modalOpen={removeAdminModal}
				onClose={handleRemoveAdminModal}
				ticketid={ticket.id}
				ticketWhatsappId={ticket.whatsappId}
			/>
		</>
	);
};

export default TicketOptionsMenu;
