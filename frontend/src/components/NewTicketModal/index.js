import React, { useState, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";

import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";

import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Autocomplete, {
	createFilterOptions,
} from "@material-ui/lab/Autocomplete";
import CircularProgress from "@material-ui/core/CircularProgress";

import { toast } from "react-toastify";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import ContactModal from "../ContactModal";
import ContactModalForGroup from "../ContactModalForGroup";
import GroupModal from "../GroupModal";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";

import AddIcon from "@material-ui/icons/Add";

const filter = createFilterOptions({
	trim: true,
});

const NewTicketModal = ({ modalOpen, onClose }) => {
	const history = useHistory();

	const [options, setOptions] = useState([]);
	const [loading, setLoading] = useState(false);
	const [searchParam, setSearchParam] = useState("");
	const [selectedContact, setSelectedContact] = useState(null);
	const [newContact, setNewContact] = useState({});
	const [newContactForGroup, setNewContactForGroup] = useState({});
	const [contactModalOpen, setContactModalOpen] = useState(false);
	const [contactModalForGroupOpen, setContactModalForGroupOpen] = useState(false);
	const [groupModalOpen, setGroupModalOpen] = useState(false);
	const [choiceInput, setChoiceInput] = useState('ticket');
  const [listSelectd, setListSelectd] = useState([])
	const [openTextBox, setOpenTextBox] = useState(false);
	const [isHovering, setIsHovering] = useState(false);
	const { user } = useContext(AuthContext);

	useEffect(() => {
		if (!modalOpen || searchParam.length < 3) {
			setLoading(false);
			return;
		}
		setLoading(true);
		const delayDebounceFn = setTimeout(() => {
			const fetchContacts = async () => {
				try {
					const { data } = await api.get("contacts", {
						params: { searchParam },
					});
					let filter = data.contacts;
					if (choiceInput !== 'ticket') {
						filter = data.contacts.filter((e, i) => e.isGroup === false)
					}
					if (choiceInput !== 'ticket' && listSelectd.length > 0) {
						const filterSelectd = listSelectd.map(e => e.split('@')[0])
						// console.log(filterSelectd)
						// console.log(filter[0].number)
						filter = filter.filter((e, i) => !(filterSelectd.includes(e.number)));
					}
					// console.log(listSelectd)
					setOptions(filter);
					setLoading(false);
				} catch (err) {
					setLoading(false);
					toastError(err);
				}
			};

			fetchContacts();
		}, 500);
		return () => clearTimeout(delayDebounceFn);
	}, [searchParam, modalOpen]);

	const handleClose = () => {
		onClose();
		setSearchParam("");
		setSelectedContact(null);
		setListSelectd([]);
		setOpenTextBox(false);
	};

	const handleSaveTicket = async contactId => {
		if (!contactId) return;
		setLoading(true);
		try {
			const { data: ticket } = await api.post("/tickets", {
				contactId: contactId,
				userId: user.id,
				status: "open",
			});
			history.push(`/tickets/${ticket.id}`);
		} catch (err) {
			toastError(err);
		}
		setLoading(false);
		handleClose();
	};

	const handleSelectOption = (e, newValue) => {
		console.log(newValue)
		if (newValue?.number) {
			setSelectedContact(newValue);
		} 
		else if (newValue?.name) {
			setNewContact({ name: newValue.name });
			setContactModalOpen(true);
		}
	};

	const handleListSelectd = (e, newValue) => {
		// console.log(newValue)
		if (newValue?.number && !listSelectd.some(e => e.number === newValue.number)) {
			const find = listSelectd.find(e => e.includes(newValue.number))
			if(find) {
				toast.error('Este contato já está na lista para ser adicionado');
				setSearchParam("");
			}
			else {
				setListSelectd([...listSelectd, `${newValue.number}@c.us`]);
				setSearchParam("");
				if(newValue.notification === undefined) toast.success('Contato adicionado a lista do grupo com sucesso!')
			}
		}
		else if (newValue?.name) {
			setNewContactForGroup({ name: newValue.name });
			setSearchParam("");
			setContactModalForGroupOpen(true);
		}
	}

	const handleCloseContactModal = () => {
		setContactModalOpen(false);
	};

	const handleCloseContactForGroupModal = () => {
		setContactModalForGroupOpen(false);
	};

	const handleCloseGroupModal = () => {
		setGroupModalOpen(false);
		handleClose();
	};

	const handleAddNewContactTicket = contact => {
		handleSaveTicket(contact.id);
	};

	const createAddContactOption = (filterOptions, params) => {
		const filtered = filter(filterOptions, params);

		if (params.inputValue !== "" && !loading && searchParam.length >= 3) {
			filtered.push({
				name: `${params.inputValue}`,
			});
		}

		return filtered;
	};

	const renderOption = option => {
		if (option.number) {
			return `${option.name} - ${option.number}`;
		} else {
			return `${i18n.t("newTicketModal.add")} ${option.name}`;
		}
	};

	const renderOptionLabel = option => {
		if (option.number) {
			return `${option.name} - ${option.number}`;
		} else {
			return `${option.name}`;
		}
	};

	return (
		<>
			<GroupModal
				open={groupModalOpen}
				initialValues={listSelectd}
				onClose={handleCloseGroupModal}
				onSave={handleAddNewContactTicket}
			/>
			<ContactModalForGroup
				open={contactModalForGroupOpen}
				initialValues={newContactForGroup}
				onClose={handleCloseContactForGroupModal}
				onSave={handleListSelectd}
			/>
			<ContactModal
				open={contactModalOpen}
				initialValues={newContact}
				onClose={handleCloseContactModal}
				onSave={handleAddNewContactTicket}
			/>
			<Dialog open={modalOpen} onClose={handleClose}>
				<div 
					style={ { display: 'flex', width: '100%', justifyContent: 'space-around' } } 
				>
					<DialogTitle 
						onClick={() => {
							setOptions([]);
							setListSelectd([])
							setChoiceInput('ticket')
						}}
						style={ { cursor: 'pointer', color: choiceInput === 'group' ? 'gray' : 'black' } }
						id="form-dialog-title"
					>
						{i18n.t("newTicketModal.title")}
					</DialogTitle>
					<DialogTitle 
						id="form-dialog-title"
						style={ { cursor: 'pointer', color: choiceInput === 'ticket' ? 'gray' : 'black' } }
						onClick={() => {
							setOptions([]);
							setChoiceInput('group')
						}} 
					>
						Criar Grupo
					</DialogTitle>
				</div>
				{ choiceInput === 'ticket'
				? (
					<>
						<DialogContent dividers>
						<Autocomplete
							options={options}
							loading={loading}
							style={{ width: 300 }}
							clearOnBlur
							autoHighlight
							freeSolo
							clearOnEscape
							getOptionLabel={renderOptionLabel}
							renderOption={renderOption}
							filterOptions={createAddContactOption}
							onChange={(e, newValue) => handleSelectOption(e, newValue)}
							renderInput={params => (
								<TextField
									{...params}
									label={i18n.t("newTicketModal.fieldLabel")}
									variant="outlined"
									autoFocus
									onChange={e => setSearchParam(e.target.value)}
									onKeyPress={e => {
										if (loading || !selectedContact) return;
										else if (e.key === "Enter") {
											handleSaveTicket(selectedContact.id);
										}
									}}
									InputProps={{
										...params.InputProps,
										endAdornment: (
											<React.Fragment>
												{loading ? (
													<CircularProgress color="inherit" size={20} />
												) : null}
												{params.InputProps.endAdornment}
											</React.Fragment>
										),
									}}
								/>
							)}
						/>
					</DialogContent>
						<DialogActions>
							<Button
								onClick={handleClose}
								color="secondary"
								disabled={loading}
								variant="outlined"
							>
								{i18n.t("newTicketModal.buttons.cancel")}
							</Button>
							<ButtonWithSpinner
								variant="contained"
								type="button"
								disabled={!selectedContact}
								onClick={() => handleSaveTicket(selectedContact.id)}
								color="primary"
								loading={loading}
							>
								{i18n.t("newTicketModal.buttons.ok")}
							</ButtonWithSpinner>
						</DialogActions>
					</>
					) 
					: (
						<>
							<div style={ { display: openTextBox ? 'none' : 'flex', alignItems: 'center', flexDirection: 'column' } }>
								<AddIcon
									onClick={() => setOpenTextBox(true)}
									onMouseEnter={() => setIsHovering(true)}
									onMouseLeave={() => setIsHovering(false)}
									style={ { display: openTextBox && 'none', cursor: isHovering && 'pointer' } }
								/>
								<p style={ { display: openTextBox && 'none' } }>total adicionado: {listSelectd.length}</p>
							</div>
						  {openTextBox && (
								<>
									<DialogContent 
									  dividers
									>
									<Autocomplete
										options={options}
										loading={loading}
										style={{ width: 300 }}
										clearOnBlur
										autoHighlight
										freeSolo
										clearOnEscape
										getOptionLabel={renderOptionLabel}
										renderOption={renderOption}
										filterOptions={createAddContactOption}
										onChange={(e, newValue) => {
											handleListSelectd(e, newValue)
											setOpenTextBox(false);
										}}
										renderInput={params => (
											<TextField
												{...params}
												label={i18n.t("newTicketModal.fieldLabel")}
												variant="outlined"
												autoFocus
												onChange={e => setSearchParam(e.target.value) }
												onKeyPress={e => {
													if (loading || !selectedContact) return;
													else if (e.key === "Enter") {
														handleSaveTicket(selectedContact.id);
													}
												}}
												InputProps={{
													...params.InputProps,
													endAdornment: (
														<React.Fragment>
															{loading ? (
																<CircularProgress color="inherit" size={20} />
															) : null}
															{params.InputProps.endAdornment}
														</React.Fragment>
													),
												}}
											/>
										)}
									/>
									<p>total adicionado: {listSelectd.length}</p>
								</DialogContent>
						</>
						)}
						<DialogActions>
						<Button
							onClick={handleClose}
							color="secondary"
							disabled={loading}
							variant="outlined"
						>
							{i18n.t("newTicketModal.buttons.cancel")}
						</Button>
						<ButtonWithSpinner
							variant="contained"
							type="button"
							disabled={!listSelectd.length > 0}
							onClick={() => setGroupModalOpen(true)}
							color="primary"
							loading={loading}
						>
							Avançar
						</ButtonWithSpinner>
					</DialogActions>
					</>
				)}
			</Dialog>
		</>
	);
};

export default NewTicketModal;
