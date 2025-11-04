<?php
include "koneksi.php";

$nama_barang = $_GET['nama_barang'] ?? '';

$query = $conn->prepare("SELECT id_barang, nama_barang, warna, foto FROM barang_temuan WHERE nama_barang LIKE ?");
$like = "%$nama_barang%";
$query->bind_param("s", $like);
$query->execute();
$result = $query->get_result();

$barang = [];
while ($row = $result->fetch_assoc()) {
  $barang[] = $row;
}

echo json_encode($barang);
?>
