import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './List.css';
import { assets } from '../../assets/assets';

const List = ({ url }) => {
  const [list, setList] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    image: '',
    countInStock: '',
  });

  const fetchList = async () => {
    try {
      const response = await axios.get('https://new-sever.vercel.app/api/products/');
      if (response.status === 200) {
        setList(response.data);
      }
    } catch (error) {
      console.error("Error fetching list:", error);
      toast.error("An error occurred while fetching the list");
    }
  };

  const removeItem = async (itemId) => {
    try {
      const response = await axios.delete(
        `https://new-sever.vercel.app/api/products/${itemId}`,
        { withCredentials: true }
      );

      if (response.status === 200) {
        setList(prevList => prevList.filter(item => item._id !== itemId));
        toast.success("Item deleted successfully");
      } else {
        toast.error("Failed to delete item");
      }
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("An error occurred while removing the item");
    }
  };

  const startEditing = (item) => {
    setEditingItem(item._id);
    setEditFormData({
      name: item.name,
      category: item.category,
      description: item.description,
      price: item.price,
      image: item.image,
      countInStock: item.countInStock,
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setEditFormData(prev => ({
          ...prev,
          image: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditFormData({
      name: '',
      category: '',
      description: '',
      price: '',
      image: '',
      countInStock: '',
    });
  };

  const updateItem = async (itemId) => {
    try {
      const response = await axios.put(
        `https://new-sever.vercel.app/api/products/${itemId}`,
        editFormData,
        { withCredentials: true }
      );

      if (response && response.data) {
        const updatedList = list.map(item =>
          item._id === itemId ? { ...item, ...editFormData } : item
        );
        setList(updatedList);
        cancelEditing();
        toast.success("Item updated successfully");
      }
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("An error occurred while updating the item");
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <div className="list add flex-col">
        <p>All Items List</p>
        <div className="list-table">
          <div className="list-table-format title">
            <b>Image</b>
            <b>Name</b>
            <b>Category</b>
            <b>Description</b>
            <b>Price</b>
            <b>Quantity</b>
            <b>Actions</b>
          </div>
          {list.length > 0 ? (
            list.map((item) => (
              <div className="list-table-format" key={item._id}>
                {editingItem === item._id ? (
                  <>
                    <div className="image-upload-container">
                      <img 
                        src={editFormData.image || assets.placeholder} 
                        alt="item" 
                        className="item-image"
                      />
                      <input
                        type="file"
                        onChange={handleImageChange}
                        accept="image/*"
                        className="image-input"
                      />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditChange}
                      className="edit-input"
                    />
                    <input
                      type="text"
                      name="category"
                      value={editFormData.category}
                      onChange={handleEditChange}
                      className="edit-input"
                    />
                    <input
                      type="text"
                      name="description"
                      value={editFormData.description}
                      onChange={handleEditChange}
                      className="edit-input"
                    />
                    <input
                      type="number"
                      name="price"
                      value={editFormData.price}
                      onChange={handleEditChange}
                      className="edit-input"
                    />
                    <input
                      type="number"
                      name="countInStock"
                      value={editFormData.countInStock}
                      onChange={handleEditChange}
                      className="edit-input"
                    />
                    <div className="action-buttons">
                      <button
                        onClick={() => updateItem(item._id)}
                        className="update-btn"
                      >
                        Update
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="cancel-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <img 
                      src={item.image || assets.placeholder} 
                      alt="item" 
                      className="item-image"
                    />
                    <p>{item.name}</p>
                    <p>{item.category}</p>
                    <p>{item.description}</p>
                    <p>LKR.{item.price}</p>
                    <div className="action-buttons">
                      <img
                        src={assets.edit}
                        alt="edit"
                        className="edit-icon"
                        onClick={() => startEditing(item)}
                      />
                      <img
                        src={assets.delete1}
                        alt="delete"
                        className="delete-icon"
                        onClick={() => removeItem(item._id)}
                      />
                    </div>
                  </>
                )}
              </div>
            ))
          ) : (
            <p>No items found</p>
          )}
        </div>
      </div>
    </>
  );
};

export default List;