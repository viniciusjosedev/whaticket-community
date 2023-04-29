import React, { useState, useEffect } from "react";
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

import RemoveIcon from "@material-ui/icons/Add";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
// import toastError from "../../errors/toastError";

const filterOptions = createFilterOptions({
	trim: true,
});

const DeletePeoplesModal = ({ modalOpen, onClose, ticketid, ticketWhatsappId }) => {
	const history = useHistory();
	const [options, setOptions] = useState([]);
	const [loading, setLoading] = useState(false);
	const [searchParam, setSearchParam] = useState("");
	const [openTextBox, setOpenTextBox] = useState(false);
	const [isHovering, setIsHovering] = useState(false);
	const [listSelectd, setListSelectd] = useState([])
	// console.log(listSelectd)
	const numberOfGroup = history.location.pathname.split('/')[2];

	useEffect(() => {
		if (!modalOpen || searchParam.length < 3) {
			setLoading(false);
			return;
		}
		setLoading(true);
		const delayDebounceFn = setTimeout(() => {
			const fetchMembers = async () => {

				setOptions([]);

				const { data: { contacts } } = await api.get("contacts")
				
				const { data: { contact: { number } } } = await api.get(`/tickets/${numberOfGroup}`)
				const { data: { groupMetadata: { participants } } } = await api.get(`/group/${number}@g.us`)
				const { data: { user } } = await api.get('/group/info');
				
				// console.log(participants);
				// console.log(contacts)

				let arrayOfParticipants = participants.map(e => e.id.user);
				arrayOfParticipants = arrayOfParticipants.filter(e => Number(e) !== Number(user));

				const filterContactInGroup = arrayOfParticipants.filter(e => {
					const verification = contacts.some(i => Number(i.number) === Number(e));
					return verification;
				});
				
				const filterNumbersWithoutContact = arrayOfParticipants.filter(e => {
					const verification = filterContactInGroup.some(i => Number(i) === Number(e));
					return !verification;
				});

				// console.log(filterNumbersWithoutContact);

				const filterAll = [ ...contacts.filter(e => filterContactInGroup.includes(e.number)),
				  ...filterNumbersWithoutContact.map(e => {
						return { name: e, number: e }
					}) 
				];

				setOptions(filterAll);
				setLoading(false);
			};

			fetchMembers();
		}, 500);
		return () => clearTimeout(delayDebounceFn);
	}, [searchParam, modalOpen]);

	const handleClose = () => {
		setListSelectd([])
		onClose();
		setSearchParam("");
		setOptions([]);
		setOpenTextBox(false);
	};

	const handleExpulse = async () => {
		const { data: { contact: { number } } } = await api.get(`/tickets/${numberOfGroup}`)
		await api.put('/group/remove', {
			chatID: `${number}@g.us`,
			peoples: listSelectd
		})
		toast.success('Pessoa(s) expulsa(s)!')
		setListSelectd([]);
		setOptions([]);
		handleClose();
	}

	const handleListSelectd = (e, newValue) => {
		if (newValue?.number) {
			const find = listSelectd.find(e => e.includes(newValue.number))
			if(find) {
				toast.error('Este contato já está na lista de remoção');
				setSearchParam("");
				setOptions([]);
			} else {
				toast.success('Contato adicionado a lista de remoção');
				setSearchParam("");
			  setListSelectd([...listSelectd, `${newValue.number}@c.us`]);
				setOptions([]);
			}
		}
	}

	return (
		<Dialog open={modalOpen} onClose={handleClose} maxWidth="lg" scroll="paper">
				<DialogTitle id="form-dialog-title">
					Remover pessoas
				</DialogTitle>
				<div style={ { display: openTextBox ? 'none' : 'flex', alignItems: 'center', flexDirection: 'column' } }>
						<RemoveIcon
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
							style={{ width: 300, marginBottom: 20 }}
							getOptionLabel={option => `${option.name} - ${option.number}`}	
							onChange={(_e, newValue) => {
								handleListSelectd(_e, newValue)
								setOpenTextBox(false);
							}}
							options={options}
							filterOptions={filterOptions}
							freeSolo
							autoHighlight
							noOptionsText={i18n.t("transferTicketModal.noOptions")}
							loading={loading}
							renderInput={params => (
								<TextField
									{...params}
									label={i18n.t("transferTicketModal.fieldLabel")}
									variant="outlined"
									required
									autoFocus
									onChange={e => setSearchParam(e.target.value)}
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
						<p>Total selecionado: {listSelectd.length}</p>
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
						onClick={ handleExpulse }
						disabled={ loading || !listSelectd.length > 0 }
						loading={loading}
					>
						Expulsar
					</ButtonWithSpinner>
				</DialogActions>
		</Dialog>
	);
};

export default DeletePeoplesModal;
