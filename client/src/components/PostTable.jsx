import React from 'react';
import styles from './PostTable.module.css';

const PostTable = ({ posts, onDelete, onView }) => {
  return (
    <div className={styles.tableSection}>
      <h2>Post Details</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Author</th>
            <th>Type</th>
            <th>Time</th>
            <th>Link</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post._id}>
              <td>{post._id}</td>
              <td>{post.author}</td>
              <td>{post.type}</td>
              <td>{post.relativeTime}</td>
              <td>
                <button className={styles.viewLink} onClick={() => onView(post)}>
                  View
                </button>
              </td>
              <td>
                <button
                  className={styles.actionButton}
                  onClick={() => onView(post)}
                  title="View"
                >
                  <i className="fas fa-eye" />
                </button>
                <button
                  className={styles.actionButton}
                  onClick={() => onDelete(post._id)}
                  title="Delete"
                >
                  <i className="fas fa-trash" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PostTable;
