import React, { useState, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";

import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";

import AddIcon from "@material-ui/icons/Add";

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
// import toastError from "../../errors/toastError";

import ContactModalForGroup from "../ContactModalForGroup";

import { AuthContext } from "../../context/Auth/AuthContext";
import toastError from "../../errors/toastError";

const filter = createFilterOptions({
	trim: true,
});

const AddPeoplesModal = ({ modalOpen, onClose, ticketid, ticketWhatsappId }) => {
	const history = useHistory();
	const [options, setOptions] = useState([]);
	const [loading, setLoading] = useState(false);
	const [searchParam, setSearchParam] = useState("");
	const [listSelectd, setListSelectd] = useState([]);
	const [selectedContact, setSelectedContact] = useState(null);
	const [openTextBox, setOpenTextBox] = useState(false);
	const numberOfGroup = history.location.pathname.split('/')[2];
	const [newContactForGroup, setNewContactForGroup] = useState({});
	const [isHovering, setIsHovering] = useState(false);
	const [contactModalForGroupOpen, setContactModalForGroupOpen] = useState(false);
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
					filter = data.contacts.filter((e, i) => e.isGroup === false)
					// if (listSelectd.length > 0) {
					// 	const filterSelectd = listSelectd.map(e => e.split('@')[0])
					// 	// console.log(filterSelectd)
					// 	// console.log(filter[0].number)
					// 	filter = filter.filter((e, i) => !(filterSelectd.includes(e.number)));
					// }
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
		setListSelectd([])
		onClose();
		setSearchParam("");
	};

	const handleAdd = async () => {
		const { data: { contact: { number } } } = await api.get(`/tickets/${numberOfGroup}`)
		const { data } = await api.put('/group/addPeoples', {
			chatID: `${number}@g.us`,
			peoples: listSelectd
		});
		// console.log(data)
		if (data.type === 'ERROR_NUMBER') {
			toast.error('Algo deu errado! Verifique o(s) número(s)!')
			setListSelectd([]);
			handleClose();
		}
		else {
			toast.success('Pessoa(s) Adicionada(s)!')
			setListSelectd([]);
			handleClose();
		}
	}

	const handleListSelectd = async (e, newValue) => {
		// console.log(newValue)
		if (newValue?.number && !listSelectd.some(e => e.number === newValue.number)) {
			const { data: { contact: { number } } } = await api.get(`/tickets/${numberOfGroup}`)
			const { data: { groupMetadata: { participants }} } = await api.get(`/group/${number}@g.us`);
			const find = participants.find(e => e.id.user === newValue.number);
			const find2 = listSelectd.find(e => e.includes(newValue.number))
			// console.log(find);
			if (find) {
				toast.error('Este contato já está no grupo');
				setSearchParam("");
			}
			else if(find2) {
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

	const createAddContactOption = (filterOptions, params) => {
		const filtered = filter(filterOptions, params);

		if (params.inputValue !== "" && !loading && searchParam.length >= 3) {
			filtered.push({
				name: `${params.inputValue}`,
			});
		}

		return filtered;
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

	const handleCloseContactForGroupModal = () => {
		setContactModalForGroupOpen(false);
	};

	return (
		<>
			<ContactModalForGroup
				open={contactModalForGroupOpen}
				initialValues={newContactForGroup}
				onClose={handleCloseContactForGroupModal}
				onSave={handleListSelectd}
			/>
			<Dialog open={modalOpen} onClose={handleClose} maxWidth="lg" scroll="paper">
					<DialogTitle id="form-dialog-title">
						Adicionar pessoas
					</DialogTitle>
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
					)}
					<DialogActions>
						<Button
							onClick={handleClose}
							color="secondary"
							disabled={loading}
							variant="outlined"
						>
							{i18n.t("transferTicketModal.buttons.cancel")}
						</Button>
						<ButtonWithSpinner
							variant="contained"
							type="button"
							color="primary"
							onClick={ handleAdd }
							disabled={ loading || !listSelectd.length > 0 }
							loading={loading}
						>
							Concluir
						</ButtonWithSpinner>
					</DialogActions>
			</Dialog>
		</>
	);
};

export default AddPeoplesModal;
